import { PencilToLine } from "@gravity-ui/icons";
import { Button, Icon } from "@gravity-ui/uikit";
import { useDispatchArrangements, useTimeOfRecords } from "app/context/hooks";
import { v7 } from "uuid";

const AddConfigureRowButton = ({
  day,
}: {
  // REFACTOR
  day: string;
}) => {
  const dispatchArrangements = useDispatchArrangements();
  const timeOfRecords = useTimeOfRecords();

  function onClick() {
    dispatchArrangements((prev) => ({
      ...prev,
      [day]: [
        ...prev[day],
        {
          playingTime: {
            start: timeOfRecords[day].start,
            end: timeOfRecords[day].end,
          },
          typeId: null,
          loudness: 100,
          id: v7(),
          fadeIn: false,
          fadeOut: false,
          fixedTime: null,
        },
      ],
    }));
  }

  return (
    <Button style={{ width: "max-content" }} view="outlined" onClick={onClick}>
      <Icon data={PencilToLine} />
      Добавить объявление
    </Button>
  );
};

export default AddConfigureRowButton;
