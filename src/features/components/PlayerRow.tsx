import {
  BackwardStepFill,
  ForwardStepFill,
  PauseFill,
  PlayFill,
} from "@gravity-ui/icons";
import { Button, Card, Flex, Icon, Slider, Text } from "@gravity-ui/uikit";
import {
  useAdTypes,
  useArrangements,
  useDispatchPlayer,
  usePlayer,
  useSources,
  useTimeOfRecords,
} from "app/context/hooks";
import { Arrangement } from "app/context/types";
import { useEffect, useState } from "react";
import { play, pause } from "shared/player";
import {
  formatTime,
  getNextArrangementItem,
  getPrevArrangementItem,
  getSecondsFromDateTime,
} from "shared/time";

const PlayerRow = () => {
  const player = usePlayer();
  const dispatchPlayer = useDispatchPlayer();
  const arrangements = useArrangements();
  const sources = useSources();
  const adTypes = useAdTypes();
  const arrangement: Arrangement[] =
    arrangements[player.primary.arrangementsKey];
  const timeOfRecords = useTimeOfRecords();
  const timeOfRecord = timeOfRecords[player.primary.arrangementsKey];
  const [marks, setMarks] = useState<number[]>([0, player.primary.duration]);
  const [prevNextArrangementItems, setPrevNextArrangementItems] = useState<{
    prev: string | null;
    next: string | null;
  }>({ prev: null, next: null });

  useEffect(() => {
    const arrangementsStartTime = [
      getSecondsFromDateTime(timeOfRecord.start),
      getSecondsFromDateTime(timeOfRecord.end),
    ];
    for (const arrangementItem of arrangement) {
      arrangementsStartTime.push(
        getSecondsFromDateTime(arrangementItem.playingTime.start),
      );
    }

    setMarks(arrangementsStartTime);
  }, [arrangements, player, timeOfRecords, arrangement, timeOfRecord.start, timeOfRecord.end]);

  useEffect(() => {
    const prev = getPrevArrangementItem(player.primary.now, arrangement);
    const next = getNextArrangementItem(player.primary.now, arrangement);

    console.log("prev", prev);
    console.log("next", next);

    const prevSource = prev
      ? sources.find((s) => s.typeId === prev.arrangementItem.typeId)
      : undefined;
    const nextSource = next
      ? sources.find((s) => s.typeId === next.arrangementItem.typeId)
      : undefined;

    console.log(sources);
    console.log("1", prevSource, nextSource);

    const prevAdType = prevSource
      ? adTypes.find((at) => at.value === prevSource.typeId)
      : undefined;
    const nextAdType = nextSource
      ? adTypes.find((at) => at.value === nextSource.typeId)
      : undefined;

    console.log("2", prevAdType, nextAdType);

    const prevContent = prevAdType?.content ?? "–";
    const nextContent = nextAdType?.content ?? "–";

    console.log("3", prevContent, nextContent);

    setPrevNextArrangementItems({
      prev: prev ? prevContent : "–",
      next: next ? nextContent : "–",
    });
  }, [arrangement, player.primary.now, sources, adTypes]);
  useEffect(() => console.log(player), [player]);

  function onClick() {
    if (player.isPlaying === "idle") {
      // Запускаем primary плеер с начала записи
      const startTime = getSecondsFromDateTime(timeOfRecord.start);
      play(dispatchPlayer, {
        ...player,
        type: "primary",
        primary: {
          ...player.primary,
          now: startTime,
          duration: getSecondsFromDateTime(timeOfRecord.end) - startTime,
          playingNow: null,
          arrangementsKey: player.primary.arrangementsKey,
        },
      });
    } else if (player.isPlaying === "play") {
      if (player.type === "secondary") {
        // Переключаемся с secondary на primary плеер
        play(dispatchPlayer, {
          ...player,
          type: "primary",
          primary: { ...player.primary },
        });
      } else {
        // Ставим primary плеер на паузу
        pause(dispatchPlayer, { ...player, type: "primary" });
      }
    } else if (player.isPlaying === "pause") {
      // Возобновляем воспроизведение
      play(dispatchPlayer, {
        ...player,
        type: "primary",
        primary: { ...player.primary },
      });
    }
  }

  function onForward() {
    const now = player.primary.now;
    const next = getNextArrangementItem(now, arrangement);
    if (next) {
      dispatchPlayer((p) => ({
        ...p,
        primary: {
          ...p.primary,
          now: next.time,
          playingNow: next.arrangementItem,
        },
      }));
    } else {
      // Если следующего объявления нет, переходим к концу записи
      const endTime = getSecondsFromDateTime(timeOfRecord.end);
      dispatchPlayer((p) => ({
        ...p,
        primary: {
          ...p.primary,
          now: endTime,
          playingNow: null,
        },
      }));
    }
  }

  function onBackward() {
    const now = player.primary.now;
    const prev = getPrevArrangementItem(now, arrangement);
    if (prev) {
      dispatchPlayer((p) => ({
        ...p,
        primary: {
          ...p.primary,
          now: prev.time,
          playingNow: prev.arrangementItem,
        },
      }));
    } else {
      // Если предыдущего объявления нет, переходим к началу записи
      const startTime = getSecondsFromDateTime(timeOfRecord.start);
      dispatchPlayer((p) => ({
        ...p,
        primary: {
          ...p.primary,
          now: startTime,
          playingNow: null,
        },
      }));
    }
  }

  function onUpdate(value: number) {
    dispatchPlayer((prev) => ({
      ...prev,
      primary: { ...prev.primary, now: value },
    }));
  }

  return (
    <Card
      view="raised"
      style={{
        zIndex: 500,
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        bottom: 0,
        borderRadius: 0,
      }}
      spacing={{ p: "4" }}
    >
      <Flex
        width={"100%"}
        direction={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        gap={"2"}
      >
        <Slider
          min={getSecondsFromDateTime(timeOfRecord.start)}
          max={getSecondsFromDateTime(timeOfRecord.end)}
          marks={marks}
          onUpdate={onUpdate}
          tooltipDisplay="on"
          value={player.primary.now}
          markFormat={(value: number) => formatTime(value)}
          style={{ width: "100%" }}
        />
        <Flex justifyContent={"center"} width={"100%"} direction="column" alignItems="center" gap="1">
          <b>{formatTime(player.primary.now)}</b>
          {player.primary.playingNow && (
            <Text variant="caption-2" color="secondary">
              Сейчас играет: {adTypes.find(at => at.value === player.primary.playingNow?.typeId)?.content || "Неизвестно"}
            </Text>
          )}
        </Flex>
        <Flex
          position="relative"
          alignItems={"center"}
          justifyContent={"space-between"}
          width={"100%"}
        >
          <Flex>
            <Text>
              <b>Предыдущее:</b> {prevNextArrangementItems.prev}
            </Text>
          </Flex>
          <Flex
            style={{
              position: "fixed",
              left: "50%",
              transform: "translateX(-50%)",
            }}
            gap={"2"}
          >
            <Button onClick={onBackward} view="flat">
              <Icon data={BackwardStepFill} />
            </Button>
            <Button view="flat" onClick={onClick}>
              <Icon
                data={
                  player.isPlaying === "play" && player.type === "primary"
                    ? PauseFill
                    : PlayFill
                }
              />
            </Button>
            <Button onClick={onForward} view="flat">
              <Icon data={ForwardStepFill} />
            </Button>
          </Flex>
          <Flex>
            <Text>
              <b>Следующее:</b> {prevNextArrangementItems.next}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};

export default PlayerRow;
