import {
  Flex,
  Select,
  SegmentedRadioGroup,
  SegmentedRadioGroupOption,
  Checkbox,
  Card,
  useToaster,
} from "@gravity-ui/uikit";
import ConfigureRowButton from "./buttons/ConfigureRowButton";
import DeleteConfigureRowButton from "./buttons/DeleteCofigureRowButton";
import CustomDateField from "./CustomDateField";
import { memo, useEffect } from "react";
import {
  Arrangement,
  Arrangements,
  DispatchArrangements,
} from "app/context/types";
import { DateTime } from "@gravity-ui/date-utils";
import {
  useAdTypes,
  useDispatchConfigureModalState,
  useSources,
} from "app/context/hooks";

// REFACTOR
const ConfigureRow = memo(
  ({
    day,
    arrangement,
    arrangements,
    setArrangements,
  }: {
    day: string;
    arrangement: Arrangement;
    arrangements: Arrangements;
    setArrangements: DispatchArrangements;
  }) => {
    const adTypes = useAdTypes();
    const dispatchConfigureState = useDispatchConfigureModalState();
    const adType = adTypes.find((item) => item.value === arrangement.typeId);
    const sources = useSources();
    const sourceWithAdType = sources.find(
      (item) => item.typeId === adType?.value,
    );
    const toaster = useToaster();

    function deleteHandler() {
      const changeArrangements = arrangements[day].filter((item) => {
        return item.id != arrangement.id ? item : null;
      });
      setArrangements((prev) => {
        return {
          ...prev,
          [day]: [...changeArrangements],
        };
      });
    }

    function configureHandler() {
      dispatchConfigureState((prev) => ({
        ...prev,
        isOpen: !prev.isOpen,
        day: day,
        arrangementId: arrangement.id,
      }));
    }

    function playingTimeStartHandler(value: DateTime | null) {
      const changedArrangementItem = {
        ...arrangement,
        playingTime: {
          ...arrangement.playingTime,
          start: value || arrangement.playingTime.start,
        },
      };

      const changedArrangement = arrangements[day].map((item) => {
        if (item.id === arrangement.id) {
          return changedArrangementItem;
        } else {
          return item;
        }
      });

      setArrangements((prev) => ({
        ...prev,
        [day]: changedArrangement,
      }));
    }

    function playingTimeEndHandler(value: DateTime | null) {
      const changedArrangementItem = {
        ...arrangement,
        playingTime: {
          ...arrangement.playingTime,
          end: value || arrangement.playingTime.end,
        },
      };
      const changedArrangement = arrangements[day].map((item) => {
        if (item.id === arrangement.id) {
          return changedArrangementItem;
        } else {
          return item;
        }
      });
      setArrangements((prev) => ({
        ...prev,
        [day]: changedArrangement,
      }));
    }

    function typeHandler(value: string[]) {
      const changedArrangementItem: Arrangement = {
        ...arrangement,
        typeId: value[0] as string,
      };
      const changedArrangement = arrangements[day].map((item) => {
        if (item.id === arrangement.id) {
          return changedArrangementItem;
        } else {
          return item;
        }
      });
      setArrangements((prev) => ({
        ...prev,
        [day]: changedArrangement,
      }));
    }

    function fixedTimeHandler(value: string) {
      const changedArrangementItem: Arrangement = {
        ...arrangement,
        fixedTime: value as Arrangement["fixedTime"],
      };
      const changedArrangement = arrangements[day].map((item) => {
        if (item.id === arrangement.id) {
          return changedArrangementItem;
        } else {
          return item;
        }
      });
      setArrangements((prev) => ({
        ...prev,
        [day]: changedArrangement,
      }));
    }
    function fadeInHandler(value: boolean) {
      const changedArrangementItem: Arrangement = {
        ...arrangement,
        fadeIn: value,
      };
      const changedArrangement = arrangements[day].map((item) => {
        if (item.id === arrangement.id) {
          return changedArrangementItem;
        } else {
          return item;
        }
      });
      setArrangements((prev) => ({
        ...prev,
        [day]: changedArrangement,
      }));
    }
    function fadeOutHandler(value: boolean) {
      const changedArrangementItem: Arrangement = {
        ...arrangement,
        fadeOut: value,
      };
      const changedArrangement = arrangements[day].map((item) => {
        if (item.id === arrangement.id) {
          return changedArrangementItem;
        } else {
          return item;
        }
      });

      setArrangements((prev) => ({
        ...prev,
        [day]: changedArrangement,
      }));
    }

    useEffect(() => {
      if (arrangement.playingTime.start > arrangement.playingTime.end) {
        toaster.add({
          title: "Начало объявления не может быть больше конца",
          theme: "danger",
          name: "error",
          autoHiding: 2000,
        });
      }
    }, [arrangement, toaster]);

    // function onBlur() {
    //   const sortedArrangement = arrangements[day].sort((a, b) => {
    //     if (a.playingTime.start < b.playingTime.start) {
    //       return -1;
    //     }
    //     return 1;
    //   });
    //   setArrangements((prev) => ({
    //     ...prev,
    //     [day]: sortedArrangement,
    //   }));
    // }

    return (
      <Card spacing={{ p: "4" }}>
        <Flex gap={"2"} width={"100%"}>
          <Flex direction={"column"} gap={"2"} width={"100%"}>
            <Flex gap={"2"}>
              <CustomDateField
                validationState={
                  arrangement.playingTime.start <= arrangement.playingTime.end
                    ? undefined
                    : "invalid"
                }
                errorMessage={
                  arrangement.playingTime.start <= arrangement.playingTime.end
                    ? undefined
                    : "Время начала объявления не может быть больше времени конца"
                }
                value={arrangement.playingTime.start}
                onUpdate={playingTimeStartHandler}
                label="Начало:"
              />
              <CustomDateField
                validationState={
                  arrangement.playingTime.start <= arrangement.playingTime.end
                    ? undefined
                    : "invalid"
                }
                errorMessage={
                  arrangement.playingTime.start <= arrangement.playingTime.end
                    ? undefined
                    : "Начало объявления не может быть больше конца"
                }
                value={arrangement.playingTime.end}
                onUpdate={playingTimeEndHandler}
                label="Конец:"
              />
            </Flex>
            <Flex gap={"2"}>
              <Select
                value={adType ? [adType.value] : []}
                onUpdate={typeHandler}
                options={adTypes}
                validationState={sourceWithAdType ? undefined : "invalid"}
                errorPlacement="inside"
                errorMessage={
                  sourceWithAdType
                    ? undefined
                    : "Для такого типа объявления еще не добавили звука или не заполнили поле"
                }
                placeholder={"Выберите тип объявления"}
              />
              <Flex alignItems={"center"} gap={"2"}>
                Фиксировать время:
                <SegmentedRadioGroup
                  value={arrangement.fixedTime}
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
                <Checkbox checked={arrangement.fadeIn} onUpdate={fadeInHandler}>
                  Fade In
                </Checkbox>
                <Checkbox
                  checked={arrangement.fadeOut}
                  onUpdate={fadeOutHandler}
                >
                  Fade Out
                </Checkbox>
              </Flex>
              <ConfigureRowButton onClick={configureHandler} />
            </Flex>
          </Flex>

          <DeleteConfigureRowButton onClick={deleteHandler} />
        </Flex>
      </Card>
    );
  },
);

export default ConfigureRow;
