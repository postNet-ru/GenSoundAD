use anyhow::{Context, Result};
use hound::{WavSpec, WavWriter};
use std::collections::HashMap;
use std::fs::File;
use std::io::BufWriter;
use std::path::Path;
use symphonia::core::audio::{AudioBufferRef, Signal};
use symphonia::core::codecs::{DecoderOptions, CODEC_TYPE_NULL};
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

use crate::audio::types::*;

pub struct AudioProcessor {
    sample_rate: u32,
}

impl AudioProcessor {
    pub fn new() -> Self {
        Self {
            sample_rate: 44100, // Стандартная частота CD качества для совместимости с FFmpeg
        }
    }

    /// Декодирует аудиофайл в PCM данные
    pub fn decode_audio_file(&self, file_path: &str) -> Result<Vec<f32>> {
        let path = Path::new(file_path);
        let file = std::fs::File::open(path)
            .with_context(|| format!("Failed to open audio file: {file_path}"))?;

        let mss = MediaSourceStream::new(Box::new(file), Default::default());
        let hint = Hint::new();

        let format_opts = FormatOptions::default();
        let metadata_opts = MetadataOptions::default();
        let decoder_opts = DecoderOptions::default();

        let probed = symphonia::default::get_probe()
            .format(&hint, mss, &format_opts, &metadata_opts)
            .with_context(|| format!("Failed to probe audio file: {file_path}"))?;

        let mut format = probed.format;
        let track = format
            .tracks()
            .iter()
            .find(|t| t.codec_params.codec != CODEC_TYPE_NULL)
            .context("No audio track found")?;

        // Получаем информацию о частоте дискретизации
        let source_sample_rate = track.codec_params.sample_rate.unwrap_or(44100);
        let needs_resampling = source_sample_rate != self.sample_rate;

        if needs_resampling {
            log::info!(
                "Декодирование файла {}: {} Hz -> {} Hz (ресемплинг требуется)",
                file_path,
                source_sample_rate,
                self.sample_rate
            );
        } else {
            log::info!(
                "Декодирование файла {}: {} Hz (ресемплинг не требуется)",
                file_path,
                source_sample_rate
            );
        }

        let track_id = track.id;

        let mut decoder = symphonia::default::get_codecs()
            .make(&track.codec_params, &decoder_opts)
            .context("Failed to create decoder")?;

        let mut samples = Vec::new();

        while let Ok(packet) = format.next_packet() {
            if packet.track_id() != track_id {
                continue;
            }

            match decoder.decode(&packet) {
                Ok(audio_buf) => {
                    // Конвертируем в моно f32 сэмплы
                    match audio_buf {
                        AudioBufferRef::F32(buf) => {
                            let channels = buf.spec().channels.count();
                            if channels == 1 {
                                samples.extend_from_slice(buf.chan(0));
                            } else {
                                // Конвертируем стерео в моно
                                let left = buf.chan(0);
                                let right = buf.chan(1);
                                for (l, r) in left.iter().zip(right.iter()) {
                                    samples.push((l + r) * 0.5);
                                }
                            }
                        }
                        AudioBufferRef::U8(buf) => {
                            let channels = buf.spec().channels.count();
                            if channels == 1 {
                                let chan_data = buf.chan(0);
                                for &sample in chan_data {
                                    let normalized = (sample as f32 - 128.0) / 128.0;
                                    samples.push(normalized);
                                }
                            } else {
                                // Стерео в моно
                                let left_data = buf.chan(0);
                                let right_data = buf.chan(1);
                                for (&left, &right) in left_data.iter().zip(right_data.iter()) {
                                    let left_norm = (left as f32 - 128.0) / 128.0;
                                    let right_norm = (right as f32 - 128.0) / 128.0;
                                    samples.push((left_norm + right_norm) * 0.5);
                                }
                            }
                        }
                        AudioBufferRef::U16(buf) => {
                            let channels = buf.spec().channels.count();
                            if channels == 1 {
                                let chan_data = buf.chan(0);
                                for &sample in chan_data {
                                    let normalized = (sample as f32 - 32768.0) / 32768.0;
                                    samples.push(normalized);
                                }
                            } else {
                                // Стерео в моно
                                let left_data = buf.chan(0);
                                let right_data = buf.chan(1);
                                for (&left, &right) in left_data.iter().zip(right_data.iter()) {
                                    let left_norm = (left as f32 - 32768.0) / 32768.0;
                                    let right_norm = (right as f32 - 32768.0) / 32768.0;
                                    samples.push((left_norm + right_norm) * 0.5);
                                }
                            }
                        }
                        _ => {
                            // Для других форматов используем общий подход
                            continue;
                        }
                    }
                }
                Err(e) => {
                    log::warn!("Decode error: {e}");
                    break;
                }
            }
        }

        // Выполняем ресемплинг если необходимо
        if needs_resampling {
            let resampled_samples =
                self.resample_audio(&samples, source_sample_rate, self.sample_rate)?;
            log::info!(
                "Ресемплинг завершен: {} -> {} сэмплов",
                samples.len(),
                resampled_samples.len()
            );
            Ok(resampled_samples)
        } else {
            Ok(samples)
        }
    }

    /// Выполняет ресемплинг аудио данных
    fn resample_audio(&self, samples: &[f32], from_rate: u32, to_rate: u32) -> Result<Vec<f32>> {
        use rubato::{
            Resampler, SincFixedIn, SincInterpolationParameters, SincInterpolationType,
            WindowFunction,
        };

        if from_rate == to_rate {
            return Ok(samples.to_vec());
        }

        let resampler_params = SincInterpolationParameters {
            sinc_len: 64, // Уменьшаем с 256 до 64 для скорости (все еще хорошее качество)
            f_cutoff: 0.95,
            interpolation: SincInterpolationType::Linear,
            oversampling_factor: 128, // Уменьшаем с 256 до 128 для скорости
            window: WindowFunction::BlackmanHarris2,
        };

        let mut resampler = SincFixedIn::<f32>::new(
            to_rate as f64 / from_rate as f64,
            2.0,
            resampler_params,
            samples.len(),
            1, // Моно канал
        )
        .map_err(|e| anyhow::anyhow!("Ошибка создания ресемплера: {}", e))?;

        let input_frames = vec![samples.to_vec()];
        let output_frames = resampler
            .process(&input_frames, None)
            .map_err(|e| anyhow::anyhow!("Ошибка ресемплинга: {}", e))?;

        Ok(output_frames[0].clone())
    }

    /// Применяет эффекты fade in/out к сэмплам
    #[allow(dead_code)]
    fn apply_fade_effects(
        &self,
        samples: &mut [f32],
        fade_in: bool,
        fade_out: bool,
        fade_duration_samples: usize,
    ) {
        let len = samples.len();

        if fade_in && len > fade_duration_samples {
            for (i, sample) in samples.iter_mut().take(fade_duration_samples).enumerate() {
                let factor = i as f32 / fade_duration_samples as f32;
                *sample *= factor;
            }
        }

        if fade_out && len > fade_duration_samples {
            let start_fade = len - fade_duration_samples;
            for (i, sample) in samples.iter_mut().skip(start_fade).enumerate() {
                let factor = 1.0 - (i as f32 / fade_duration_samples as f32);
                *sample *= factor;
            }
        }
    }

    /// Генерирует финальный аудиофайл для записи
    pub async fn render_record(
        &self,
        record_name: &str,
        arrangements: &[Arrangement],
        time_record: &TimeOfRecord,
        sources: &[Source],
        progress_callback: impl Fn(ExportProgress) + Send + Sync,
    ) -> Result<Vec<f32>> {
        let start_time = time_record.start.timestamp_millis();
        let end_time = time_record.end.timestamp_millis();
        let duration_ms = end_time - start_time;
        let duration_seconds = duration_ms as f64 / 1000.0;

        log::info!(
            "Рендеринг записи '{}': длительность {:.2} сек ({:.2} мин)",
            record_name,
            duration_seconds,
            duration_seconds / 60.0
        );

        // Создаем буфер для финального аудио
        let total_samples = (duration_seconds * self.sample_rate as f64) as usize;
        let mut final_buffer = vec![0.0f32; total_samples];

        log::info!(
            "Создан буфер на {} сэмплов ({}x{} Hz)",
            total_samples,
            duration_seconds,
            self.sample_rate
        );

        progress_callback(ExportProgress {
            stage: "loading".to_string(),
            progress: 0.0,
            message: format!("Загрузка аудиофайлов для записи {record_name}"),
            record_name: Some(record_name.to_string()),
        });

        // Кэшируем декодированные аудиофайлы
        let mut audio_cache: HashMap<String, Vec<f32>> = HashMap::new();

        for (i, source) in sources.iter().enumerate() {
            let progress = (i as f32 / sources.len() as f32) * 30.0;
            progress_callback(ExportProgress {
                stage: "loading".to_string(),
                progress,
                message: format!("Декодирование файла: {}", source.title),
                record_name: Some(record_name.to_string()),
            });

            match self.decode_audio_file(&source.file_path) {
                Ok(samples) => {
                    audio_cache.insert(source.id.clone(), samples);
                }
                Err(e) => {
                    log::warn!("Failed to decode {}: {}", source.title, e);
                }
            }
        }

        progress_callback(ExportProgress {
            stage: "processing".to_string(),
            progress: 30.0,
            message: format!("Обработка объявлений для записи {record_name}"),
            record_name: Some(record_name.to_string()),
        });

        // Обрабатываем каждое объявление
        for (i, arrangement) in arrangements.iter().enumerate() {
            let progress = 30.0 + (i as f32 / arrangements.len() as f32) * 60.0;
            progress_callback(ExportProgress {
                stage: "processing".to_string(),
                progress,
                message: format!("Обработка объявления {}/{}", i + 1, arrangements.len()),
                record_name: Some(record_name.to_string()),
            });

            // Находим соответствующий источник
            let source = sources
                .iter()
                .find(|s| s.type_id == arrangement.type_id)
                .context("Source not found for arrangement")?;

            if let Some(source_samples) = audio_cache.get(&source.id) {
                self.apply_arrangement_to_buffer(
                    &mut final_buffer,
                    source_samples,
                    source,
                    arrangement,
                    start_time,
                )?;
            }
        }

        progress_callback(ExportProgress {
            stage: "processing".to_string(),
            progress: 90.0,
            message: "Нормализация аудио".to_string(),
            record_name: Some(record_name.to_string()),
        });

        // Нормализуем громкость
        self.normalize_audio(&mut final_buffer);

        Ok(final_buffer)
    }

    /// Применяет объявление к финальному буферу
    fn apply_arrangement_to_buffer(
        &self,
        final_buffer: &mut [f32],
        source_samples: &[f32],
        source: &Source,
        arrangement: &Arrangement,
        record_start_ms: i64,
    ) -> Result<()> {
        let arrangement_start_ms = arrangement.playing_time.start.timestamp_millis();
        let arrangement_end_ms = arrangement.playing_time.end.timestamp_millis();

        // Вычисляем смещение от начала записи
        let offset_ms = arrangement_start_ms - record_start_ms;
        let offset_samples = ((offset_ms as f64 / 1000.0) * self.sample_rate as f64) as usize;

        // Вычисляем длительность
        let duration_ms = arrangement_end_ms - arrangement_start_ms;
        let duration_samples = ((duration_ms as f64 / 1000.0) * self.sample_rate as f64) as usize;

        log::info!(
            "Arrangement: offset_ms={offset_ms}, duration_ms={duration_ms}, offset_samples={offset_samples}, duration_samples={duration_samples}"
        );

        // Получаем обрезанную часть источника
        let cut_start_samples = (source.cut.start * self.sample_rate as f64) as usize;
        let cut_end_samples = (source.cut.end * self.sample_rate as f64) as usize;
        let cut_end_samples = cut_end_samples.min(source_samples.len());

        log::info!(
            "Source cut: start={:.2}s, end={:.2}s -> samples {}..{} (source len: {})",
            source.cut.start,
            source.cut.end,
            cut_start_samples,
            cut_end_samples,
            source_samples.len()
        );

        if cut_start_samples >= cut_end_samples || cut_start_samples >= source_samples.len() {
            log::warn!("Invalid cut range, skipping arrangement");
            return Ok(());
        }

        let source_cut = &source_samples[cut_start_samples..cut_end_samples];
        let samples_to_copy = duration_samples.min(source_cut.len());

        log::info!(
            "Copying {} samples from source_cut (len: {}) to buffer at offset {}",
            samples_to_copy,
            source_cut.len(),
            offset_samples
        );

        // Применяем громкость
        let loudness = arrangement.loudness.unwrap_or(100.0) / 100.0;

        // Fade effects
        let fade_duration_samples = (0.3 * self.sample_rate as f64) as usize; // 300ms fade

        // Копируем данные с зацикливанием если необходимо
        for i in 0..duration_samples {
            let target_index = offset_samples + i;
            if target_index >= final_buffer.len() {
                break;
            }

            // Зацикливаем источник если он короче нужной длительности
            let source_index = i % source_cut.len();
            let mut sample = source_cut[source_index] * loudness;

            // Apply fade in
            if arrangement.fade_in && i < fade_duration_samples {
                let fade_factor = i as f32 / fade_duration_samples as f32;
                sample *= fade_factor;
            }

            // Apply fade out
            if arrangement.fade_out && i >= duration_samples - fade_duration_samples {
                let remaining = duration_samples - i;
                let fade_factor = remaining as f32 / fade_duration_samples as f32;
                sample *= fade_factor;
            }

            // Mix with existing audio
            final_buffer[target_index] += sample;
        }

        Ok(())
    }

    /// Нормализует аудио для предотвращения клиппинга
    fn normalize_audio(&self, buffer: &mut [f32]) {
        let max_amplitude = buffer.iter().map(|&s| s.abs()).fold(0.0f32, f32::max);

        log::info!("Нормализация аудио: макс. амплитуда {max_amplitude:.3}");

        if max_amplitude > 0.95 {
            let normalize_factor = 0.9 / max_amplitude;
            log::info!("Применяем нормализацию с коэффициентом {normalize_factor:.3}");
            for sample in buffer.iter_mut() {
                *sample *= normalize_factor;
            }
        } else {
            log::info!("Нормализация не требуется");
        }
    }

    /// Сохраняет аудио в WAV файл
    #[allow(dead_code)]
    pub fn save_as_wav(&self, samples: &[f32], output_path: &str) -> Result<()> {
        let spec = WavSpec {
            channels: 1,
            sample_rate: self.sample_rate,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let file = File::create(output_path)
            .with_context(|| format!("Failed to create output file: {output_path}"))?;

        let mut writer = WavWriter::new(BufWriter::new(file), spec)
            .with_context(|| "Failed to create WAV writer")?;

        for &sample in samples {
            let sample_i16 = (sample.clamp(-1.0, 1.0) * i16::MAX as f32) as i16;
            writer
                .write_sample(sample_i16)
                .context("Failed to write sample")?;
        }

        writer.finalize().context("Failed to finalize WAV file")?;

        Ok(())
    }
}
