// Tauri API wrapper for audio processing
import { Arrangements, TimeOfRecords, Source, ExportSettings } from '../app/context/types';

// Утилитарная функция для безопасной проверки Tauri
function checkTauriAvailability(): boolean {
  return typeof window !== 'undefined' && !!(window as typeof window & { __TAURI__?: unknown }).__TAURI__;
}

// Tип источника для Tauri (без Blob, с путем к файлу)
interface TauriSource {
  title: string;
  file_path: string;
  id: string;
  typeId: string | null;
  cut: {
    start: number;
    end: number;
  };
}

export interface TauriExportRequest {
  sources: TauriSource[];
  arrangements: Record<string, unknown[]>;
  time_of_records: Record<string, unknown>;
  settings: ExportSettings;
  record_name: string;
}

export interface TauriExportProgress {
  stage: 'loading' | 'processing' | 'encoding' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  record_name?: string;
}

export class TauriAudioAPI {
  private progressListeners: ((progress: TauriExportProgress) => void)[] = [];

  constructor() {
    // Слушаем события прогресса от Rust backend
    this.setupProgressListener();
  }

  private async setupProgressListener() {
    try {
      // Проверяем доступность Tauri
      if (checkTauriAvailability()) {
        const { listen } = await import('@tauri-apps/api/event');
        await listen('export_progress', (event: { payload: TauriExportProgress }) => {
          this.progressListeners.forEach(listener => listener(event.payload));
        });
      }
    } catch (error) {
      console.log('Tauri event API недоступен:', error);
    }
  }

  // Экспорт аудио через Tauri
  async exportAudio(
    sources: Source[],
    arrangements: Arrangements,
    timeOfRecords: TimeOfRecords,
    settings: ExportSettings,
    recordName: string,
    outputDir?: string
  ): Promise<string> {
    // Если папка не выбрана, даем пользователю выбрать
    if (!outputDir) {
      const selectedDir = await this.selectOutputDirectory();
      if (!selectedDir) {
        throw new Error('Не выбрана папка для сохранения');
      }
      outputDir = selectedDir;
    }

    // Проверяем, что все источники имеют файлы
    for (const source of sources) {
      if (!source.file || !(source.file instanceof File)) {
        throw new Error(`Источник ${source.title} не содержит файл`);
      }
    }

    // Конвертируем источники для Tauri
    const tauriSources: TauriSource[] = await Promise.all(
      sources.map(async (source) => {
        const filePath = await this.saveSourceToTempFile(source);
        return {
          title: source.title,
          file_path: filePath,
          id: source.id,
          typeId: source.typeId,
          cut: source.cut,
        };
      })
    );

    const request: TauriExportRequest = {
      sources: tauriSources,
      arrangements,
      time_of_records: timeOfRecords,
      settings,
      record_name: recordName,
    };

    try {
      // Проверяем доступность Tauri
      if (!checkTauriAvailability()) {
        throw new Error('Tauri API недоступен');
      }

      const { invoke } = await import('@tauri-apps/api/core');
      const resultPath = await invoke('export_audio', {
        request,
        outputDir,
      }) as string;
      return resultPath;
    } catch (error) {
      throw new Error(`Ошибка экспорта: ${error}`);
    }
  }

  // Сохраняет Blob источника во временный файл
  private async saveSourceToTempFile(source: Source): Promise<string> {
    // Пока используем упрощенный подход - отправляем команду в Rust для сохранения файла
    try {
      if (!checkTauriAvailability()) {
        throw new Error('Tauri API недоступен');
      }

      const { invoke } = await import('@tauri-apps/api/core');
      const arrayBuffer = await source.file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Вызываем Rust команду для сохранения файла
      const tempPath = await invoke('save_temp_file', {
        fileName: `${source.id}.${this.getFileExtension(source.file.type)}`,
        fileData: Array.from(uint8Array), // Конвертируем в обычный массив для сериализации
      }) as string;
      
      return tempPath;
    } catch (error) {
      throw new Error(`Не удалось сохранить временный файл для источника ${source.title}: ${error}`);
    }
  }

  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
      'audio/mp4': 'm4a',
    };
    return extensions[mimeType] || 'mp3';
  }

  // Выбор папки для сохранения
  async selectOutputDirectory(): Promise<string | null> {
    try {
      if (!checkTauriAvailability()) {
        return null;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('select_output_directory') as string | null;
    } catch (error) {
      console.error('Ошибка выбора папки:', error);
      return null;
    }
  }

  // Выбор аудиофайлов
  async selectAudioFiles(): Promise<string[]> {
    try {
      if (!checkTauriAvailability()) {
        return [];
      }

      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('select_audio_files') as string[];
    } catch (error) {
      console.error('Ошибка выбора файлов:', error);
      return [];
    }
  }

  // Подписка на события прогресса
  onProgress(callback: (progress: TauriExportProgress) => void) {
    this.progressListeners.push(callback);
    
    // Возвращаем функцию для отписки
    return () => {
      const index = this.progressListeners.indexOf(callback);
      if (index > -1) {
        this.progressListeners.splice(index, 1);
      }
    };
  }

  // Проверка доступности Tauri
  static isAvailable(): boolean {
    try {
      return checkTauriAvailability();
    } catch {
      return false;
    }
  }

  // Асинхронная проверка доступности через тестовый вызов
  static async testAvailability(): Promise<boolean> {
    try {
      if (!checkTauriAvailability()) {
        return false;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('select_output_directory');
      return true;
    } catch {
      return false;
    }
  }

  // Проверка доступности FFmpeg
  static async checkFFmpegAvailability(): Promise<{ available: boolean; message: string }> {
    try {
      if (!checkTauriAvailability()) {
        return { 
          available: false, 
          message: 'Tauri API недоступен'
        };
      }

      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke('check_ffmpeg_availability') as string;
      return { available: true, message: result };
    } catch (error) {
      return { 
        available: false, 
        message: `FFmpeg недоступен: ${error}. Пожалуйста, убедитесь что FFmpeg включен в bundle приложения.`
      };
    }
  }
}

// Singleton экземпляр
export const tauriAudioAPI = new TauriAudioAPI();
