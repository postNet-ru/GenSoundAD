import { DateTime } from "@gravity-ui/date-utils";
import { Arrangement, TimeOfRecord } from '../app/context/types';

export interface TimeInterval {
  start: DateTime;
  end: DateTime;
  id: string;
  title?: string;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  affectedIds: string[];
  severity: 'critical' | 'medium' | 'low';
}

export interface TimeValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  overlaps: Array<{
    arrangement1: Arrangement;
    arrangement2: Arrangement;
    overlapDuration: number; // в секундах
  }>;
}

/**
 * Проверяет пересекаются ли два временных интервала
 */
export function intervalsOverlap(interval1: TimeInterval, interval2: TimeInterval): boolean {
  const start1 = interval1.start.valueOf();
  const end1 = interval1.end.valueOf();
  const start2 = interval2.start.valueOf();
  const end2 = interval2.end.valueOf();

  return start1 < end2 && start2 < end1;
}

/**
 * Вычисляет длительность пересечения двух интервалов в секундах
 */
export function getOverlapDuration(interval1: TimeInterval, interval2: TimeInterval): number {
  if (!intervalsOverlap(interval1, interval2)) {
    return 0;
  }

  const start1 = interval1.start.valueOf();
  const end1 = interval1.end.valueOf();
  const start2 = interval2.start.valueOf();
  const end2 = interval2.end.valueOf();

  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  return (overlapEnd - overlapStart) / 1000; // конвертируем в секунды
}

/**
 * Проверяет находится ли объявление в пределах временной записи
 */
export function isArrangementWithinRecord(
  arrangement: Arrangement,
  timeRecord: TimeOfRecord
): boolean {
  const arrStart = arrangement.playingTime.start.valueOf();
  const arrEnd = arrangement.playingTime.end.valueOf();
  const recordStart = timeRecord.start.valueOf();
  const recordEnd = timeRecord.end.valueOf();

  return arrStart >= recordStart && arrEnd <= recordEnd;
}

/**
 * Валидирует временные интервалы для всех объявлений в записи
 */
export function validateTimeIntervals(
  arrangements: Arrangement[],
  timeRecord: TimeOfRecord,
  recordName: string
): TimeValidationResult {
  const issues: ValidationIssue[] = [];
  const overlaps: Array<{
    arrangement1: Arrangement;
    arrangement2: Arrangement;
    overlapDuration: number;
  }> = [];

  // Проверка корректности каждого объявления
  for (const arrangement of arrangements) {
    const arrStart = arrangement.playingTime.start.valueOf();
    const arrEnd = arrangement.playingTime.end.valueOf();

    // Проверка: начало < конца
    if (arrStart >= arrEnd) {
      issues.push({
        type: 'error',
        message: `Время начала объявления должно быть раньше времени окончания`,
        affectedIds: [arrangement.id],
        severity: 'critical'
      });
    }

    // Проверка: объявление в пределах записи
    if (!isArrangementWithinRecord(arrangement, timeRecord)) {
      const recordStart = timeRecord.start;
      const recordEnd = timeRecord.end;
      
      issues.push({
        type: 'error',
        message: `Объявление выходит за пределы записи "${recordName}" (${recordStart.format('HH:mm')} - ${recordEnd.format('HH:mm')})`,
        affectedIds: [arrangement.id],
        severity: 'critical'
      });
    }

    // Проверка длительности
    const duration = (arrEnd - arrStart) / 1000;
    if (duration < 1) {
      issues.push({
        type: 'warning',
        message: `Очень короткое объявление (${duration.toFixed(1)}с)`,
        affectedIds: [arrangement.id],
        severity: 'low'
      });
    }

    if (duration > 300) { // 5 минут
      issues.push({
        type: 'warning',
        message: `Очень длинное объявление (${Math.round(duration / 60)}мин)`,
        affectedIds: [arrangement.id],
        severity: 'medium'
      });
    }
  }

  // Проверка пересечений между объявлениями
  for (let i = 0; i < arrangements.length; i++) {
    for (let j = i + 1; j < arrangements.length; j++) {
      const arr1 = arrangements[i];
      const arr2 = arrangements[j];

      const interval1: TimeInterval = {
        start: arr1.playingTime.start,
        end: arr1.playingTime.end,
        id: arr1.id
      };

      const interval2: TimeInterval = {
        start: arr2.playingTime.start,
        end: arr2.playingTime.end,
        id: arr2.id
      };

      if (intervalsOverlap(interval1, interval2)) {
        const overlapDuration = getOverlapDuration(interval1, interval2);
        
        overlaps.push({
          arrangement1: arr1,
          arrangement2: arr2,
          overlapDuration
        });

        const severity = overlapDuration > 5 ? 'critical' : overlapDuration > 1 ? 'medium' : 'low';
        const type = severity === 'critical' ? 'error' : 'warning';

        issues.push({
          type,
          message: `Пересечение объявлений на ${overlapDuration.toFixed(1)}с`,
          affectedIds: [arr1.id, arr2.id],
          severity
        });
      }
    }
  }

  // Проверка временной записи
  const recordStart = timeRecord.start.valueOf();
  const recordEnd = timeRecord.end.valueOf();

  if (recordStart >= recordEnd) {
    issues.push({
      type: 'error',
      message: `Время начала записи "${recordName}" должно быть раньше времени окончания`,
      affectedIds: [],
      severity: 'critical'
    });
  }

  const recordDuration = (recordEnd - recordStart) / 1000;
  if (recordDuration > 24 * 3600) { // 24 часа
    issues.push({
      type: 'warning',
      message: `Очень длинная запись "${recordName}" (${Math.round(recordDuration / 3600)}ч)`,
      affectedIds: [],
      severity: 'medium'
    });
  }

  return {
    isValid: !issues.some(issue => issue.type === 'error'),
    issues,
    overlaps
  };
}

/**
 * Валидирует все записи проекта
 */
export function validateAllRecords(
  arrangements: Record<string, Arrangement[]>,
  timeOfRecords: Record<string, TimeOfRecord>
): Record<string, TimeValidationResult> {
  const results: Record<string, TimeValidationResult> = {};

  for (const [recordName, recordArrangements] of Object.entries(arrangements)) {
    const timeRecord = timeOfRecords[recordName];
    if (timeRecord) {
      results[recordName] = validateTimeIntervals(recordArrangements, timeRecord, recordName);
    }
  }

  return results;
}

/**
 * Получает общую сводку по всем ошибкам проекта
 */
export function getProjectValidationSummary(
  validationResults: Record<string, TimeValidationResult>
): {
  hasErrors: boolean;
  hasWarnings: boolean;
  totalIssues: number;
  criticalIssues: number;
} {
  let totalIssues = 0;
  let criticalIssues = 0;
  let hasErrors = false;
  let hasWarnings = false;

  for (const result of Object.values(validationResults)) {
    totalIssues += result.issues.length;
    
    for (const issue of result.issues) {
      if (issue.type === 'error') {
        hasErrors = true;
        if (issue.severity === 'critical') {
          criticalIssues++;
        }
      } else if (issue.type === 'warning') {
        hasWarnings = true;
      }
    }
  }

  return {
    hasErrors,
    hasWarnings,
    totalIssues,
    criticalIssues
  };
}

/**
 * Получает список всех ошибок с подробными описаниями
 */
export function getDetailedValidationErrors(
  validationResults: Record<string, TimeValidationResult>
): string[] {
  const errors: string[] = [];

  for (const [recordName, result] of Object.entries(validationResults)) {
    for (const issue of result.issues) {
      if (issue.type === 'error') {
        const prefix = `[${recordName}]`;
        errors.push(`${prefix} ${issue.message}`);
      }
    }
  }

  return errors;
}

/**
 * Получает список всех предупреждений с подробными описаниями
 */
export function getDetailedValidationWarnings(
  validationResults: Record<string, TimeValidationResult>
): string[] {
  const warnings: string[] = [];

  for (const [recordName, result] of Object.entries(validationResults)) {
    for (const issue of result.issues) {
      if (issue.type === 'warning') {
        const prefix = `[${recordName}]`;
        warnings.push(`${prefix} ${issue.message}`);
      }
    }
  }

  return warnings;
}
