import CustomModal from "./CustomModal";
import { Button, Flex, Slider, Text } from "@gravity-ui/uikit";
import {
  useArrangements,
  useConfigureModalState,
  useDispatchArrangements,
  useDispatchConfigureModalState,
} from "app/context/hooks";
import { Arrangement } from "app/context/types";
import { useEffect, useState } from "react";

const ConfigureArrangementModal = () => {
  const configureState = useConfigureModalState();
  const dispatchConfigureState = useDispatchConfigureModalState();
  const arrangements = useArrangements();
  const dispatchArrangements = useDispatchArrangements();
  const [arrangement, setArrangement] = useState<Arrangement | null>();

  useEffect(() => {
    if (configureState.arrangementId) {
      if (configureState.day) {
        setArrangement(
          arrangements[configureState.day].find(
            (item) => item.id === configureState.arrangementId,
          ),
        );
      }
    }
  }, [configureState, arrangements]);

  function onCancle() {
    dispatchConfigureState({
      isOpen: false,
      day: null,
      arrangementId: null,
    });
  }

  function onSave() {
    dispatchConfigureState({
      isOpen: false,
      day: null,
      arrangementId: null,
    });
  }

  function onUpdate(value: number) {
    if (arrangement) {
      if (configureState.arrangementId) {
        if (configureState.day) {
          dispatchArrangements((prev) => ({
            ...prev,
            [String(configureState.day)]: prev[String(configureState.day)].map(
              (item: Arrangement) => {
                if (item.id === configureState.arrangementId) {
                  return {
                    ...item,
                    loudness: value,
                  };
                } else {
                  return item;
                }
              },
            ),
          }));
        }
      }
    }
  }

  return (
    <CustomModal
      title="Настройка объявления"
      state={configureState}
      setState={dispatchConfigureState}
    >
      <Flex width={"100%"} direction={"column"} gap={"2"}>
        <Text variant="subheader-2">Громкость</Text>
        <Slider
          value={arrangement?.loudness || 0}
          tooltipDisplay="on"
          tooltipFormat={(value) => `${value}%`}
          markFormat={(value) => `${value}%`}
          onUpdate={onUpdate}
          min={0}
          max={100}
        />
        <Flex gap={"2"} width={"100%"}>
          <Button onClick={onCancle} width="max">
            Отменить
          </Button>
          <Button onClick={onSave} width="max" view="outlined-action">
            Сохранить
          </Button>
        </Flex>
      </Flex>
    </CustomModal>
  );
};

export default ConfigureArrangementModal;
