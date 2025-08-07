import { DateTime } from "@gravity-ui/date-utils";
import { useEffect, useState } from "react";
import { Source } from "app/context/types";

interface UseArrangementTimingParams {
  selectedSource?: Source;
  fixedTime: "start" | "end" | null;
  startTime: DateTime;
  endTime: DateTime;
  onStartTimeChange: (time: DateTime) => void;
  onEndTimeChange: (time: DateTime) => void;
}

export function useArrangementTiming({
  selectedSource,
  fixedTime,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange
}: UseArrangementTimingParams) {
  const [sourceDuration, setSourceDuration] = useState<number>(0);

  // Рассчитываем длительность источника
  useEffect(() => {
    if (!selectedSource?.file) {
      setSourceDuration(0);
      return;
    }

    const calculateDuration = async () => {
      try {
        const audioContext = new AudioContext();
        const arrayBuffer = await selectedSource.file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Учитываем настройки обрезки источника
        const fullDuration = audioBuffer.duration;
        const cutStart = selectedSource.cut?.start || 0;
        const cutEnd = selectedSource.cut?.end || fullDuration;
        const actualDuration = cutEnd - cutStart;
        
        setSourceDuration(actualDuration);
        audioContext.close();
      } catch (error) {
        console.error('Ошибка при расчете длительности источника:', error);
        setSourceDuration(0);
      }
    };

    calculateDuration();
  }, [selectedSource]);

  // Автоматически корректируем время при изменении настроек
  useEffect(() => {
    if (!fixedTime || sourceDuration === 0) return;

    const startMs = startTime.valueOf();
    const endMs = endTime.valueOf();
    const currentDurationMs = endMs - startMs;
    const requiredDurationMs = sourceDuration * 1000;

    // Если текущая длительность не соответствует длительности источника
    if (Math.abs(currentDurationMs - requiredDurationMs) > 1000) { // погрешность 1 сек
      if (fixedTime === "start") {
        // Фиксируем начало, корректируем конец
        const newEndTime = startTime.add({ seconds: sourceDuration });
        onEndTimeChange(newEndTime);
      } else if (fixedTime === "end") {
        // Фиксируем конец, корректируем начало
        const newStartTime = endTime.subtract({ seconds: sourceDuration });
        onStartTimeChange(newStartTime);
      }
    }
  }, [fixedTime, sourceDuration, startTime, endTime, onStartTimeChange, onEndTimeChange]);

  // Валидация времени
  const validateTiming = () => {
    const issues: string[] = [];
    
    if (startTime.valueOf() >= endTime.valueOf()) {
      issues.push("Время начала должно быть раньше времени окончания");
    }

    const durationMs = endTime.valueOf() - startTime.valueOf();
    const durationSeconds = durationMs / 1000;

    if (sourceDuration > 0 && Math.abs(durationSeconds - sourceDuration) > 1) {
      issues.push(`Длительность объявления (${durationSeconds.toFixed(1)}с) не соответствует длительности источника (${sourceDuration.toFixed(1)}с)`);
    }

    if (durationSeconds < 0.5) {
      issues.push("Слишком короткое объявление (минимум 0.5 секунды)");
    }

    if (durationSeconds > 3600) { // 1 час
      issues.push("Слишком длинное объявление (максимум 1 час)");
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  };

  // Утилита для быстрой установки времени на основе источника
  const setTimingFromSource = (referenceTime: DateTime, mode: "start" | "end") => {
    if (sourceDuration === 0) return;

    if (mode === "start") {
      onStartTimeChange(referenceTime);
      onEndTimeChange(referenceTime.add({ seconds: sourceDuration }));
    } else {
      onEndTimeChange(referenceTime);
      onStartTimeChange(referenceTime.subtract({ seconds: sourceDuration }));
    }
  };

  // Форматирование информации о длительности
  const getDurationInfo = () => {
    const durationMs = endTime.valueOf() - startTime.valueOf();
    const durationSeconds = durationMs / 1000;
    
    return {
      currentDuration: durationSeconds,
      sourceDuration,
      isDurationMatching: sourceDuration > 0 ? Math.abs(durationSeconds - sourceDuration) < 1 : true,
      durationDifference: sourceDuration > 0 ? durationSeconds - sourceDuration : 0
    };
  };

  return {
    sourceDuration,
    validateTiming,
    setTimingFromSource,
    getDurationInfo
  };
}
