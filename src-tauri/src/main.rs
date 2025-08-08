// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::Result;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use tauri::{Emitter, Manager, State};

mod audio;
use audio::*;

// Функция для получения пути к встроенному FFmpeg
fn get_ffmpeg_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    let ffmpeg_name = "ffmpeg.exe";
    #[cfg(target_os = "macos")]
    let ffmpeg_name = "ffmpeg";
    #[cfg(target_os = "linux")]
    let ffmpeg_name = "ffmpeg";

    #[cfg(target_os = "windows")]
    let platform_dir = "windows";
    #[cfg(target_os = "macos")]
    let platform_dir = "macos";
    #[cfg(target_os = "linux")]
    let platform_dir = "linux";

    // В режиме разработки используем файлы из исходной папки проекта
    #[cfg(debug_assertions)]
    {
        let current_dir = std::env::current_dir()
            .map_err(|e| format!("Не удалось получить текущую папку: {e}"))?;

        let ffmpeg_path = current_dir
            .join("binaries")
            .join(platform_dir)
            .join(ffmpeg_name);

        if ffmpeg_path.exists() {
            Ok(ffmpeg_path)
        } else {
            Err(format!(
                "FFmpeg не найден в режиме разработки по пути: {}.\n\
                 Пожалуйста, запустите скрипт загрузки:\n\
                 Windows: .\\scripts\\download-ffmpeg.ps1\n\
                 macOS/Linux: ./scripts/download-ffmpeg.sh",
                ffmpeg_path.display()
            ))
        }
    }

    // В режиме production используем ресурсы из bundle
    #[cfg(not(debug_assertions))]
    {
        // Обращаемся к app_handle
        let resource_dir = app_handle
            .path()
            .resource_dir()
            .map_err(|e| format!("Не удалось получить путь к ресурсам: {}", e))?;

        let ffmpeg_path = resource_dir
            .join("binaries")
            .join(platform_dir)
            .join(ffmpeg_name);

        if !ffmpeg_path.exists() {
            return Err(format!(
                "FFmpeg не найден в bundle по пути: {}. Возможно, он не был включен в сборку.",
                ffmpeg_path.display()
            ));
        }

        // На Unix системах проверяем права на выполнение
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let metadata = std::fs::metadata(&ffmpeg_path)
                .map_err(|e| format!("Не удалось получить метаданные файла: {}", e))?;
            let permissions = metadata.permissions();
            if permissions.mode() & 0o111 == 0 {
                return Err("FFmpeg не имеет прав на выполнение".to_string());
            }
        }

        Ok(ffmpeg_path)
    }
}

// Состояние для отслеживания прогресса
#[derive(Default)]
struct AppState {
    // Поле оставлено для будущего использования
}

#[tauri::command]
async fn export_audio(
    request: ExportRequest,
    output_dir: String,
    app_handle: tauri::AppHandle,
    _state: State<'_, AppState>,
) -> Result<String, String> {
    let processor = AudioProcessor::new();

    let arrangements = request
        .arrangements
        .get(&request.record_name)
        .ok_or_else(|| "Record not found".to_string())?;
    let time_record = request
        .time_of_records
        .get(&request.record_name)
        .ok_or_else(|| "Time record not found".to_string())?;

    let app_handle_clone = app_handle.clone();
    let progress_callback = move |progress: ExportProgress| {
        let _ = app_handle_clone.emit("export_progress", &progress);
    };

    let samples = processor
        .render_record(
            &request.record_name,
            arrangements,
            time_record,
            &request.sources,
            progress_callback,
        )
        .await
        .map_err(|e| e.to_string())?;

    let final_path = PathBuf::from(&output_dir).join(format!(
        "{}.{}",
        request.record_name, request.settings.extension
    ));

    export_samples_with_ffmpeg(
        &samples,
        final_path.to_str().unwrap(),
        &request.settings,
        &app_handle,
    )
    .map_err(|e| e.to_string())?;

    let final_path_str = final_path.to_string_lossy().to_string();

    let _ = app_handle.emit(
        "export_progress",
        &ExportProgress {
            stage: "completed".to_string(),
            progress: 100.0,
            message: "Экспорт завершен".to_string(),
            record_name: Some(request.record_name.clone()),
        },
    );

    Ok(final_path_str)
}

fn export_samples_with_ffmpeg(
    samples: &[f32],
    output_path: &str,
    settings: &ExportSettings,
    app_handle: &tauri::AppHandle,
) -> Result<()> {
    use std::process::{Command, Stdio};

    let sample_rate = 44100.0;
    let expected_duration = samples.len() as f64 / sample_rate;
    let hours = (expected_duration / 3600.0) as u32;
    let minutes = ((expected_duration % 3600.0) / 60.0) as u32;
    let seconds = (expected_duration % 60.0) as u32;

    log::info!(
        "Экспорт {} сэмплов в {}, длительность: {}:{:02}:{:02}",
        samples.len(),
        settings.extension,
        hours,
        minutes,
        seconds
    );

    let ffmpeg_path = get_ffmpeg_path(app_handle)
        .map_err(|e| anyhow::anyhow!("Ошибка получения пути к FFmpeg: {}", e))?;

    let _ = app_handle.emit(
        "export_progress",
        &ExportProgress {
            stage: "encoding".to_string(),
            progress: 80.0,
            message: format!("Кодирование в {}", settings.extension),
            record_name: None,
        },
    );

    let mut args = vec!["-f", "f32le", "-ar", "44100", "-ac", "1", "-i", "pipe:0"];
    let bitrate = format!("{}k", settings.bitrate);

    match settings.extension.as_str() {
        "mp3" => args.extend_from_slice(&[
            "-codec:a",
            "libmp3lame",
            "-b:a",
            &bitrate,
            "-cbr",
            "1",
            "-reservoir",
            "0",
        ]),
        "ogg" => args.extend_from_slice(&[
            "-codec:a",
            "libvorbis",
            "-b:a",
            &bitrate,
            "-minrate",
            &bitrate,
            "-maxrate",
            &bitrate,
        ]),
        "flac" => args.extend_from_slice(&[
            "-codec:a",
            "flac",
            "-compression_level",
            "5",
            "-exact_rice_parameters",
            "1",
        ]),
        "wav" => args.extend_from_slice(&["-codec:a", "pcm_s16le"]),
        other => anyhow::bail!("Неподдерживаемый формат: {}", other),
    }

    args.extend_from_slice(&[
        "-avoid_negative_ts",
        "make_zero",
        "-fflags",
        "+genpts",
        "-y",
        output_path,
    ]);

    let mut child = Command::new(&ffmpeg_path)
        .args(&args)
        .stdin(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| anyhow::anyhow!("Не удалось запустить FFmpeg: {}", e))?;

    let mut stdin = child
        .stdin
        .take()
        .ok_or_else(|| anyhow::anyhow!("Нет stdin у FFmpeg"))?;
    let chunk_size = 44100;
    let total = samples.len().div_ceil(chunk_size);

    for (i, chunk) in samples.chunks(chunk_size).enumerate() {
        for &s in chunk {
            stdin
                .write_all(&s.to_le_bytes())
                .map_err(|e| anyhow::anyhow!("Ошибка записи: {}", e))?;
        }
        let prog = 80.0 + (i as f32 / total as f32) * 15.0;
        let _ = app_handle.emit(
            "export_progress",
            &ExportProgress {
                stage: "encoding".to_string(),
                progress: prog,
                message: format!("{}: {:.1}%", settings.extension, prog - 80.0),
                record_name: None,
            },
        );
    }
    drop(stdin);

    let out = child
        .wait_with_output()
        .map_err(|e| anyhow::anyhow!("FFmpeg завершился с ошибкой: {}", e))?;
    if !out.status.success() {
        let err = String::from_utf8_lossy(&out.stderr);
        anyhow::bail!("FFmpeg: {}", err);
    }
    Ok(())
}

#[tauri::command]
async fn select_output_directory() -> Result<Option<String>, String> {
    use rfd::FileDialog;
    Ok(FileDialog::new()
        .set_title("Выберите папку")
        .pick_folder()
        .map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
async fn select_audio_files() -> Result<Vec<String>, String> {
    use rfd::FileDialog;
    Ok(FileDialog::new()
        .set_title("Выберите аудиофайлы")
        .add_filter("Audio", &["mp3", "wav", "ogg", "flac", "m4a"])
        .pick_files()
        .unwrap_or_default()
        .into_iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect())
}

#[tauri::command]
async fn save_temp_file(file_name: String, file_data: Vec<u8>) -> Result<String, String> {
    let temp_dir = std::env::temp_dir().join("ring_generator_temp");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("Не удалось создать temp: {e}"))?;
    let path = temp_dir.join(&file_name);
    let mut f = fs::File::create(&path).map_err(|e| format!("Не удалось создать файл: {e}"))?;
    f.write_all(&file_data)
        .map_err(|e| format!("Не удалось записать: {e}"))?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
async fn check_ffmpeg_availability(app_handle: tauri::AppHandle) -> Result<String, String> {
    get_ffmpeg_path(&app_handle)
        .map(|p| format!("FFmpeg найден: {}", p.display()))
        .map_err(|e| e)
}

#[tauri::command]
async fn test_tauri_availability() -> Result<String, String> {
    Ok("Tauri API доступен".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            export_audio,
            select_output_directory,
            select_audio_files,
            save_temp_file,
            check_ffmpeg_availability,
            test_tauri_availability
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
