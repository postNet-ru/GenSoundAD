import { Flex } from "@gravity-ui/uikit";
import { DispatchSourcesContext, SourcesContext } from "app/context/context";
import { SoundRow } from "./SoundRow";
import { useContext } from "react";

const SoundList = () => {
  const sources = useContext(SourcesContext);
  const setSources = useContext(DispatchSourcesContext);
  if (sources.length) {
    return (
      <Flex direction={"column"} gap={"2"}>
        {sources.map((item, id) => (
          <SoundRow
            sources={sources}
            setSources={setSources}
            source={item}
            key={id}
          />
        ))}
      </Flex>
    );
  } else {
    return null;
  }
};

export default SoundList;
