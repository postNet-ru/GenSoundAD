import { DateField } from "@gravity-ui/date-components";
import { Flex, useToaster } from "@gravity-ui/uikit";
import AddConfigureRowButton from "./buttons/AddConfigureRowButton";
import ConfigureList from "./ConfigureList";
import { useDispatchTimeOfRecords, useTimeOfRecords } from "app/context/hooks";
import { DateTime } from "@gravity-ui/date-utils";
import { useEffect } from "react";

const TabPanelContent = ({ day }: { day: string }) => {
  const timeOfRecords = useTimeOfRecords();
  const dispatchTimeOfRecords = useDispatchTimeOfRecords();
  const toaster = useToaster();

  function onUpdateEnd(value: DateTime | null) {
    if (value) {
      dispatchTimeOfRecords((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          end: value,
        },
      }));
    }
  }
  function onUpdateStart(value: DateTime | null) {
    if (value) {
      dispatchTimeOfRecords((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          start: value,
        },
      }));
    }
  }

  useEffect(() => {
    if (timeOfRecords[day].start > timeOfRecords[day].end) {
      toaster.add({
        name: "danger",
        title: "Время начала записи не может быть больше времени конца",
        theme: "danger",
        autoHiding: 2000,
      });
    }
  }, [timeOfRecords, day, toaster]);

  return (
    <Flex direction={"column"} gap={"2"}>
      <DateField
        value={timeOfRecords[day].start}
        onUpdate={onUpdateStart}
        label="Время начала записи:"
        placeholder=""
        format="HH:mm:ss"
      />
      <ConfigureList day={day} />
      <AddConfigureRowButton day={day} />
      <DateField
        value={timeOfRecords[day].end}
        onUpdate={onUpdateEnd}
        label="Время конца записи:"
        placeholder=""
        format="HH:mm:ss"
      />
    </Flex>
  );
};

export default TabPanelContent;
