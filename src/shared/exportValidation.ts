import { Source, Arrangement, TimeOfRecords } from '../app/context/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExportValidationParams {
  sources: Source[];
  arrangements: Record<string, Arrangement[]>;
  timeOfRecords: TimeOfRecords;
}

/**
 * Валидирует данные для экспорта аудиофайлов
 */
export function validateExportData(params: ExportValidationParams): ValidationResult {
  const { sources, arrangements, timeOfRecords } = params;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Проверка источников
  if (sources.length === 0) {
    errors.push('Добавьте хотя бы один источник звука');
  }

  // Проверка объявлений
  const hasArrangements = Object.values(arrangements).some(arr => arr.length > 0);
  if (!hasArrangements) {
    errors.push('Добавьте хотя бы одно объявление в записи');
  }

  // Проверка временных записей
  const timeRecordCount = Object.keys(timeOfRecords).length;
  if (timeRecordCount === 0) {
    errors.push('Создайте хотя бы одну временную запись');
  }

  // Проверка связей между источниками и объявлениями
  const sourceTypeIds = new Set(sources.map(s => s.typeId).filter(Boolean));
  const arrangementTypeIds = new Set<string>();
  
  Object.values(arrangements).forEach(arr => 
    arr.forEach(arrangement => {
      if (arrangement.typeId) {
        arrangementTypeIds.add(arrangement.typeId);
      }
    })
  );

  const missingSourceTypes = Array.from(arrangementTypeIds).filter(
    typeId => !sourceTypeIds.has(typeId)
  );

  if (missingSourceTypes.length > 0) {
    errors.push('Для некоторых объявлений отсутствуют соответствующие источники звука');
  }

  // Проверка файлов источников
  const invalidSources = sources.filter(source => !source.file);
  if (invalidSources.length > 0) {
    errors.push(`Отсутствуют файлы для ${invalidSources.length} источников`);
  }

  // Предупреждения о потенциальных проблемах
  const largeSources = sources.filter(source => 
    source.file && source.file.size > 50 * 1024 * 1024 // 50MB
  );
  if (largeSources.length > 0) {
    warnings.push(`${largeSources.length} источников имеют большой размер (>50MB). Экспорт может занять больше времени`);
  }

  // Проверка длительности объявлений
  const longArrangements = Object.values(arrangements)
    .flat()
    .filter(arr => {
      // Рассчитываем длительность на основе времени воспроизведения
      const startMs = arr.playingTime.start.valueOf();
      const endMs = arr.playingTime.end.valueOf();
      const durationSeconds = (endMs - startMs) / 1000;
      return durationSeconds > 300; // 5 минут
    });

  if (longArrangements.length > 0) {
    warnings.push(`${longArrangements.length} объявлений имеют длительность более 5 минут`);
  }

  // Проверка временных интервалов
  for (const [recordName, timeRecord] of Object.entries(timeOfRecords)) {
    const arrangements = params.arrangements[recordName] || [];
    if (arrangements.length === 0) {
      warnings.push(`Запись "${recordName}" не содержит объявлений`);
    }

    // Проверка корректности времени
    const startTime = timeRecord.start.valueOf();
    const endTime = timeRecord.end.valueOf();
    
    if (startTime >= endTime) {
      errors.push(`Время начала записи "${recordName}" должно быть раньше времени окончания`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Рассчитывает предполагаемый размер экспорта
 */
export function estimateExportSize(params: ExportValidationParams, format: string, bitrate: number): {
  estimatedSizeMB: number;
  estimatedDurationMinutes: number;
} {
  const { timeOfRecords } = params;
  
  let totalDurationSeconds = 0;
  
  for (const timeRecord of Object.values(timeOfRecords)) {
    const startTime = timeRecord.start.valueOf();
    const endTime = timeRecord.end.valueOf();
    const durationMs = endTime - startTime;
    totalDurationSeconds += durationMs / 1000;
  }

  const estimatedDurationMinutes = totalDurationSeconds / 60;
  
  // Расчет размера на основе битрейта
  // Битрейт в kbps, время в секундах
  let estimatedSizeKB = (bitrate * totalDurationSeconds) / 8;
  
  // Корректировка для разных форматов
  if (format === 'flac') {
    estimatedSizeKB *= 3; // FLAC обычно больше MP3 в 3 раза
  } else if (format === 'wav') {
    estimatedSizeKB *= 5; // WAV больше MP3 в 5 раз
  }
  
  const estimatedSizeMB = estimatedSizeKB / 1024;

  return {
    estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100,
    estimatedDurationMinutes: Math.round(estimatedDurationMinutes * 100) / 100
  };
}
