import { Card, Flex, Text } from "@gravity-ui/uikit";
import Tabs from "./Tabs";
import { useEffect } from "react";
import SaveLayoutButton from "./buttons/SaveLayoutButton";
import LoadLayoutButton from "./buttons/LoadLayoutButton";
import ConfigureArrangementModal from "./modals/SetupArrangementModal";
import TabsManager from "./TabsManager";
import AddInEachArrangementButton from "./buttons/AddInEachArrangementButton";
import AddInEachArrangementModal from "./modals/AddInEachRecordModal";
import { useDispatchPlayer, useTimeOfRecords, useActiveTab, useDispatchActiveTab } from "app/context/hooks";
import { getSecondsFromDateTime } from "shared/time";

const Stage2 = () => {
  const activeTab = useActiveTab();
  const setActiveTab = useDispatchActiveTab();
  const dispatchPlayer = useDispatchPlayer();
  const timeOfRecords = useTimeOfRecords();

  useEffect(() => {
    const timeOfRecord = timeOfRecords[activeTab];
    if (timeOfRecord) {
      const startTime = getSecondsFromDateTime(timeOfRecord.start);
      const endTime = getSecondsFromDateTime(timeOfRecord.end);
      const duration = endTime - startTime;

      dispatchPlayer((prev) => ({
        ...prev,
        isPlaying: prev.isPlaying === "idle" ? "idle" : "pause",
        primary: {
          ...prev.primary,
          arrangementsKey: activeTab,
          now: startTime,
          duration: duration,
          playingNow: null,
        },
      }));
    }
  }, [activeTab, timeOfRecords, dispatchPlayer]);

  return (
    <Card spacing={{ p: "4" }}>
      <AddInEachArrangementModal />
      <Flex direction={"column"} gap={"2"}>
        <Flex direction={"column"}>
          <Flex
            wrap
            alignItems={"center"}
            justifyContent={"space-between"}
            direction={{ s: "column", m: "row" }}
          >
            <ConfigureArrangementModal />
            <Text variant="body-3">2. Расстановка</Text>
            <Flex
              gap="2"
              justifyContent={{ s: "center", m: "flex-end" }}
              alignItems={"center"}
              wrap
            >
              <AddInEachArrangementButton />
              <SaveLayoutButton />
              <LoadLayoutButton />
            </Flex>
          </Flex>
        </Flex>
        <TabsManager />
        <Tabs value={activeTab} onUpdate={setActiveTab} />
      </Flex>
    </Card>
  );
};

export default Stage2;
