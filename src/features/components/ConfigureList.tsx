import { Flex } from "@gravity-ui/uikit";
import { memo } from "react";
import ConfigureRow from "./ConfigureRow";
import { useArrangements, useDispatchArrangements } from "app/context/hooks";

// REFACTOR
const ConfigureList = memo(({ day }: { day: string }) => {
  const arrangements = useArrangements();
  const setArrangements = useDispatchArrangements();

  if (arrangements[day].length) {
    return (
      <Flex direction={"column"} gap={"2"}>
        {arrangements[day].map((item, id) => (
          <ConfigureRow
            day={day}
            arrangements={arrangements}
            setArrangements={setArrangements}
            arrangement={item}
            key={id}
          />
        ))}
      </Flex>
    );
  } else {
    return null;
  }
});

export default ConfigureList;
