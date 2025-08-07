import { useDispatchPlayer, usePlayer, useSources, useArrangements, useTimeOfRecords } from "app/context/hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { createAudioComposition, findActiveSegment, ComposedAudioSegment } from "shared/audioComposer";

const Player = () => {
  const player = usePlayer();
  const dispatchPlayer = useDispatchPlayer();
  const sources = useSources();
  const arrangements = useArrangements();
  const timeOfRecords = useTimeOfRecords();
  const ref = useRef<HTMLAudioElement>(null);
  const refSecondary = useRef<HTMLAudioElement>(null);
  const [composition, setComposition] = useState<ComposedAudioSegment[]>([]);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  // URL для secondary плеера с учетом обрезки
  const secondaryUrl = useMemo(() => {
    if (player.secondary.file) {
      return URL.createObjectURL(player.secondary.file);
    }
    return undefined;
  }, [player.secondary.file]);

  // Создаем композицию для текущего дня
  useEffect(() => {
    const currentArrangements = arrangements[player.primary.arrangementsKey];
    const currentTimeOfRecord = timeOfRecords[player.primary.arrangementsKey];
    
    if (currentArrangements && currentTimeOfRecord) {
      const newComposition = createAudioComposition(
        currentArrangements,
        sources,
        currentTimeOfRecord
      );
      setComposition(newComposition);
    }
  }, [arrangements, sources, timeOfRecords, player.primary.arrangementsKey]);

  // Таймер для синхронизации primary плеера
  useEffect(() => {
    if (player.type === "primary" && player.isPlaying === "play") {
      const id = setInterval(() => {
        dispatchPlayer((prev) => {
          const newTime = prev.primary.now + 1;
          const activeSegment = findActiveSegment(composition, newTime);
          
          return {
            ...prev,
            primary: {
              ...prev.primary,
              now: newTime,
              playingNow: activeSegment?.arrangement || null
            }
          };
        });
      }, 1000);
      
      setIntervalId(id as unknown as number);
      
      return () => {
        clearInterval(id);
        setIntervalId(null);
      };
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }
  }, [player.type, player.isPlaying, composition, dispatchPlayer, intervalId]);

  // Применяем настройки обрезки для secondary плеера
  useEffect(() => {
    if (refSecondary.current && player.secondary.sourceId) {
      const source = sources.find((s) => s.id === player.secondary.sourceId);
      if (source) {
        const audio = refSecondary.current;
        
        // Устанавливаем начальную позицию с учетом обрезки
        audio.currentTime = source.cut.start;
        
        // Добавляем обработчик для остановки воспроизведения на конце обрезки
        const handleTimeUpdate = () => {
          if (audio.currentTime >= source.cut.end) {
            audio.pause();
            dispatchPlayer((prev) => ({ ...prev, isPlaying: "pause" }));
          }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        
        // Cleanup
        return () => {
          audio.removeEventListener('timeupdate', handleTimeUpdate);
        };
      }
    }
  }, [player.secondary.sourceId, sources, dispatchPlayer]);

  // Основная логика управления плеерами
  useEffect(() => {
    if (player.type === "secondary") {
      if (player.isPlaying === "pause") {
        refSecondary.current?.pause();
      } else if (player.isPlaying === "ready") {
        dispatchPlayer((prev) => ({ ...prev, isPlaying: "play" }));
        
        // Применяем обрезку при начале воспроизведения
        if (refSecondary.current && player.secondary.sourceId) {
          const source = sources.find((s) => s.id === player.secondary.sourceId);
          if (source) {
            refSecondary.current.currentTime = source.cut.start;
          }
        }
        
        refSecondary.current?.play();
      }
    } else {
      if (player.isPlaying === "pause") {
        ref.current?.pause();
      } else if (player.isPlaying === "ready") {
        dispatchPlayer((prev) => ({ ...prev, isPlaying: "play" }));
        ref.current?.play();
        refSecondary.current?.pause();
      }
    }
  }, [player, dispatchPlayer, sources]);

  // Добавляем обработчик timeupdate для синхронизации позиции secondary плеера
  useEffect(() => {
    const audio = refSecondary.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (player.type === "secondary" && player.isPlaying === "play") {
        // Здесь можно добавить логику синхронизации позиции если понадобится
        // Например, обновление UI индикатора позиции для secondary плеера
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [player.type, player.isPlaying]);

  // Cleanup URL при размонтировании
  useEffect(() => {
    return () => {
      if (secondaryUrl) URL.revokeObjectURL(secondaryUrl);
    };
  }, [secondaryUrl]);

  return (
    <>
      <audio
        key={player.secondary.sourceId}
        ref={refSecondary}
        style={{ display: "none" }}
        src={secondaryUrl}
      />
      <audio
        key={player.primary.arrangementsKey}
        ref={ref}
        style={{ display: "none" }}
      />
    </>
  );
};

export default Player;
