import CustomModal from "./CustomModal";
import { useEffect, useState } from "react";
import { Button, Flex, Slider } from "@gravity-ui/uikit";
import {
  useCutModalState,
  useDispatchCutModalState,
  useDispatchSources,
  useSources,
} from "app/context/hooks";
import { formatTime } from "shared/time";
import { getAudioDuration } from "shared/file";

const CutSourceModal = () => {
  const cutState = useCutModalState();
  const dispatchCutState = useDispatchCutModalState();
  const sources = useSources();
  const dispatchSources = useDispatchSources();
  const [range, setRange] = useState<[number, number]>([0, 100]);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (cutState.sourceId) {
      const foundSource = sources.find((s) => s.id === cutState.sourceId);
      if (!foundSource) {
        return;
      }

      setRange([foundSource?.cut?.start, foundSource?.cut?.end]);

      getAudioDuration(foundSource.file).then((duration) => {
        setDuration(duration);
      });
    }
  }, [cutState.sourceId, sources]);

  function onCancle() {
    dispatchCutState((prev) => ({ ...prev, isOpen: false }));
  }

  function onCut() {
    dispatchSources((prev) => {
      return prev.map((source) => {
        if (source.id === cutState.sourceId) {
          return {
            ...source,
            cut: {
              start: range[0],
              end: range[1],
            },
          };
        }
        return source;
      });
    });
    dispatchCutState((prev) => ({ ...prev, isOpen: false }));
  }

  return (
    <CustomModal
      title="Обрезка звукового файла"
      state={cutState}
      setState={dispatchCutState}
    >
      <Flex width={"100%"} direction={"column"} gap={"2"}>
        <Slider
          markFormat={(value: number) => formatTime(value)}
          min={0}
          max={duration}
          style={{ width: "100%" }}
          onUpdate={setRange}
          value={range}
          tooltipDisplay="on"
        />
        <Flex gap={"2"} width={"100%"}>
          <Button onClick={onCancle} width="max">
            Отменить
          </Button>
          <Button onClick={onCut} view="outlined-action" width="max">
            Обрезать
          </Button>
        </Flex>
      </Flex>
    </CustomModal>
  );
};

export default CutSourceModal;
