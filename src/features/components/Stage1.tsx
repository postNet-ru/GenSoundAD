import { Card, Flex, Text } from "@gravity-ui/uikit";
import DnD from "./DnD";
import SoundList from "./SoundList";
import { CutSourceModal } from "./modals";
import AdTypesManager from "./AdTypesManager";

const Stage1 = () => {
  return (
    <Card view="outlined" spacing={{ p: "4" }}>
      <Flex direction={"column"} gap={"2"} justifyContent={"center"}>
        <CutSourceModal />
        <Text variant="body-3">1. Добавление звуков</Text>
        <AdTypesManager />
        <DnD />
        <SoundList />
      </Flex>
    </Card>
  );
};

export default Stage1;
