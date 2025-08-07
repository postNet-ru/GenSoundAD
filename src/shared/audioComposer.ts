import { Source, Arrangement } from '../app/context/types';
import { convertDateTimeToSeconds } from './time';
import { DateTime } from '@gravity-ui/date-utils';

export interface ComposedAudioSegment {
  startTime: number;
  endTime: number;
  source: Source;
  arrangement: Arrangement;
}

/**
 * Создает композицию аудио сегментов для воспроизведения расписания дня
 */
export function createAudioComposition(
  arrangements: Arrangement[],
  sources: Source[],
  timeOfRecord: { start: DateTime; end: DateTime }
): ComposedAudioSegment[] {
  const composition: ComposedAudioSegment[] = [];
  
  // Преобразуем DateTime в секунды для начала и конца записи
  const recordStart = convertDateTimeToSeconds(timeOfRecord.start);
  
  const recordEnd = convertDateTimeToSeconds(timeOfRecord.end);

  // Сортируем объявления по времени начала
  const sortedArrangements = [...arrangements].sort((a, b) => {
    const aTime = convertDateTimeToSeconds(a.playingTime.start);
    const bTime = convertDateTimeToSeconds(b.playingTime.start);
    return aTime - bTime;
  });

  // Создаем сегменты для каждого объявления
  for (const arrangement of sortedArrangements) {
    const source = sources.find(s => s.typeId === arrangement.typeId);
    if (!source) continue;

    const startTime = arrangement.playingTime.start.second() + 
      arrangement.playingTime.start.minute() * 60 + 
      arrangement.playingTime.start.hour() * 3600;
    
    const endTime = arrangement.playingTime.end.second() + 
      arrangement.playingTime.end.minute() * 60 + 
      arrangement.playingTime.end.hour() * 3600;

    // Проверяем, что сегмент находится в пределах записи
    if (startTime >= recordStart && endTime <= recordEnd) {
      composition.push({
        startTime,
        endTime,
        source,
        arrangement
      });
    }
  }

  return composition;
}

/**
 * Находит активный сегмент для заданного времени
 */
export function findActiveSegment(
  composition: ComposedAudioSegment[],
  currentTime: number
): ComposedAudioSegment | null {
  return composition.find(segment => 
    currentTime >= segment.startTime && currentTime <= segment.endTime
  ) || null;
}

/**
 * Находит следующий сегмент после заданного времени
 */
export function findNextSegment(
  composition: ComposedAudioSegment[],
  currentTime: number
): ComposedAudioSegment | null {
  return composition.find(segment => segment.startTime > currentTime) || null;
}

/**
 * Находит предыдущий сегмент до заданного времени
 */
export function findPreviousSegment(
  composition: ComposedAudioSegment[],
  currentTime: number
): ComposedAudioSegment | null {
  const previousSegments = composition.filter(segment => segment.startTime < currentTime);
  return previousSegments[previousSegments.length - 1] || null;
}
