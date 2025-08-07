import {
  useAddInEachArrangementModalState,
  useAdTypes,
  useArrangements,
  useDispatchAddInEachArrangementModalState,
  useDispatchArrangements,
} from "app/context/hooks";
import CustomModal from "./CustomModal";
import {
  Flex,
  Select,
  SegmentedRadioGroup,
  SegmentedRadioGroupOption,
  Checkbox,
  Button,
} from "@gravity-ui/uikit";
import CustomDateField from "../CustomDateField";
import { useState } from "react";
import { Arrangement, Arrangements } from "app/context/types";
import { DateTime, dateTime } from "@gravity-ui/date-utils";
import { v7 } from "uuid";

const AddInEachArrangementModal = () => {
  const [arrangement, setArrangement] = useState<Arrangement>({
    playingTime: {
      start: dateTime(),
      end: dateTime(),
    },
    typeId: null,
    id: v7(),
    fadeIn: false,
    fadeOut: false,
    fixedTime: null,
    loudness: 0,
  });
  const arrangements = useArrangements();
  const dispatchArrangements = useDispatchArrangements();
  const adTypes = useAdTypes();
  const adType =
    adTypes.find((item) => item.value === arrangement.typeId) || null;
  const addInEachArrangementModalState = useAddInEachArrangementModalState();
  const dispatchAddInEachArrangementModalState =
    useDispatchAddInEachArrangementModalState();

  function playingTimeStartHandler(value: DateTime | null) {
    const changedArrangementItem = {
      ...arrangement,
      playingTime: {
        ...arrangement.playingTime,
        start: value || arrangement.playingTime.start,
      },
    };
    setArrangement({
      ...changedArrangementItem,
    });
  }

  function playingTimeEndHandler(value: DateTime | null) {
    const changedArrangementItem = {
      ...arrangement,
      playingTime: {
        ...arrangement.playingTime,
        end: value || arrangement.playingTime.end,
      },
    };
    setArrangement({
      ...changedArrangementItem,
    });
  }

  function typeHandler(value: string[]) {
    const changedArrangementItem: Arrangement = {
      ...arrangement,
      typeId: value[0] as string,
    };
    setArrangement({
      ...changedArrangementItem,
    });
  }

  function fixedTimeHandler(value: string) {
    const changedArrangementItem: Arrangement = {
      ...arrangement,
      fixedTime: value as Arrangement["fixedTime"],
    };
    setArrangement({
      ...changedArrangementItem,
    });
  }
  function fadeInHandler(value: boolean) {
    const changedArrangementItem: Arrangement = {
      ...arrangement,
      fadeIn: value,
    };
    setArrangement({
      ...changedArrangementItem,
    });
  }
  function fadeOutHandler(value: boolean) {
    const changedArrangementItem: Arrangement = {
      ...arrangement,
      fadeOut: value,
    };
    setArrangement({
      ...changedArrangementItem,
    });
  }

  function onCancel() {
    setArrangement({
      playingTime: {
        start: dateTime(),
        end: dateTime(),
      },
      typeId: null,
      id: v7(),
      fadeIn: false,
      fadeOut: false,
      fixedTime: null,
      loudness: 0,
    });

    dispatchAddInEachArrangementModalState({
      isOpen: false,
    });
  }
  function onAdd() {
    const updatedArrangements: Arrangements = {};
    for (const day in arrangements) {
      updatedArrangements[day] = [
        ...arrangements[day],
        {
          ...arrangement,
        },
      ];
    }
    dispatchArrangements({
      ...updatedArrangements,
    });

    setArrangement({
      playingTime: {
        start: dateTime(),
        end: dateTime(),
      },
      typeId: null,
      id: v7(),
      fadeIn: false,
      fadeOut: false,
      fixedTime: null,
      loudness: 0,
    });

    dispatchAddInEachArrangementModalState({
      isOpen: false,
    });
  }

  return (
    <CustomModal
      title="Добавить объявление в каждую запись"
      setState={(e) => {
        setArrangement({
          playingTime: {
            start: dateTime(),
            end: dateTime(),
          },
          typeId: null,
          id: v7(),
          fadeIn: false,
          fadeOut: false,
          fixedTime: null,
          loudness: 0,
        });
        dispatchAddInEachArrangementModalState(e);
      }}
      state={addInEachArrangementModalState}
    >
      <Flex width={"100%"} direction={"column"} gap={"2"}>
        <Flex gap={"2"} width={"100%"}>
          <Flex direction={"column"} gap={"2"} width={"100%"}>
            <Flex gap={"2"}>
              <CustomDateField
                value={arrangement?.playingTime.start || dateTime()}
                onUpdate={playingTimeStartHandler}
                label="Начало:"
              />
              <CustomDateField
                value={arrangement?.playingTime.end || dateTime()}
                onUpdate={playingTimeEndHandler}
                label="Конец:"
              />
            </Flex>
            <Flex gap={"2"}>
              <Select
                value={adType ? [adType.value] : []}
                onUpdate={typeHandler}
                options={adTypes}
                placeholder={"Выберите тип объявления"}
              />
              <Flex alignItems={"center"} gap={"2"}>
                Фиксировать время:
                <SegmentedRadioGroup
                  value={arrangement?.fixedTime || "start"}
                  onUpdate={fixedTimeHandler}
                >
                  <SegmentedRadioGroupOption value="start">
                    Начало
                  </SegmentedRadioGroupOption>
                  <SegmentedRadioGroupOption value="nd">
                    Конец
                  </SegmentedRadioGroupOption>
                </SegmentedRadioGroup>
              </Flex>
              <Flex gap={"2"} alignItems={"center"}>
                <Checkbox
                  checked={arrangement?.fadeIn || false}
                  onUpdate={fadeInHandler}
                >
                  Fade In
                </Checkbox>
                <Checkbox
                  checked={arrangement?.fadeOut || false}
                  onUpdate={fadeOutHandler}
                >
                  Fade Out
                </Checkbox>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        <Flex gap={"2"} width={"100%"}>
          <Button onClick={onCancel} width="max">
            Отмена
          </Button>
          <Button onClick={onAdd} width="max" view="outlined-action">
            Добавить
          </Button>
        </Flex>
      </Flex>
    </CustomModal>
  );
};

export default AddInEachArrangementModal;
