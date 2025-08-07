import { Card, Flex, Icon, Select, Text } from "@gravity-ui/uikit";
import { MusicNote, Clock, WeightHanging } from "@gravity-ui/icons";
import DeleteSourceButton from "./buttons/DeleteSourceButton";
import CutSourceButton from "./buttons/CutSourceButton";
import PlaySourceButton from "./buttons/PlaySourceButton";
import { DispatchSources, Source } from "app/context/types";
import {
  useAdTypes,
  useDispatchCutModalState,
  useDispatchPlayer,
  usePlayer,
} from "app/context/hooks";
import { formatTime } from "shared/time";
import { getAudioDuration } from "shared/file";
import { useEffect, useState, useCallback } from "react";

export const SoundRow = ({
  source,
  sources,
  setSources,
}: {
  source: Source;
  sources: Source[];
  setSources: DispatchSources;
}) => {
  const player = usePlayer();
  const dispatchPlayer = useDispatchPlayer();
  const setCutModalState = useDispatchCutModalState();
  const adTypes = useAdTypes();
  const adType = adTypes.find((item) => item.value === source.typeId);
  const [duration, setDuration] = useState(0);

  const getDuration = useCallback(async () => {
    const duration = await getAudioDuration(source.file);
    return duration;
  }, [source.file]);

  useEffect(() => {
    getDuration().then((duration) => {
      setDuration(duration);
    });
  }, [sources, getDuration]);

  function deleteHandler() {
    if (player.secondary.sourceId === source.id) {
      dispatchPlayer((prev) => ({
        ...prev,
        isPlaying: "pause",
      }));
    }
    const changedSources = sources.filter((item) => {
      return item.id != source.id ? item : null;
    });
    setSources(changedSources);
  }

  function cutHandler() {
    setCutModalState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      sourceId: source.id,
    }));
  }

  function typeHandler(value: string[]) {
    const changedSources = sources.map((item) => {
      if (item.id === source.id) {
        item = { ...item, typeId: value[0] };
        return item;
      } else {
        return item;
      }
    });
    setSources(changedSources);
  }

  return (
    <Card spacing={{ p: "4" }}>
      <Flex wrap gap={"2"} alignItems={"center"}>
        <DeleteSourceButton onClick={deleteHandler} />
        <PlaySourceButton item={source} />
        <Flex direction={"column"} justifyContent={"center"} gap={"0.5"}>
          <Flex gap={"1"}>
            <Icon data={MusicNote} />
            <Text>{source.title}</Text>
          </Flex>
          <Flex gap={"2"}>
            <Flex gap={"1"}>
              <Icon data={WeightHanging} />
              <Text variant="caption-2">
                {(source.file.size / 1024 / 1024).toFixed(2)} мб
              </Text>
            </Flex>
            <Flex gap={"1"}>
              <Icon data={Clock} />
              <Text variant="caption-2">{formatTime(duration, false)}</Text>
            </Flex>
          </Flex>
        </Flex>

        <Select
          errorPlacement="inside"
          errorMessage={source.typeId ? undefined : "Не выбран тип объявления"}
          value={adType ? [adType.value] : []}
          validationState={source.typeId ? undefined : "invalid"}
          placeholder="Выберите тип объявления"
          onUpdate={typeHandler}
          options={adTypes}
        />
        <CutSourceButton onClick={cutHandler} />
      </Flex>
    </Card>
  );
};
