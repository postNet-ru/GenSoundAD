import { FloppyDisk } from "@gravity-ui/icons";
import { Button, Icon } from "@gravity-ui/uikit";
import {
  useAdTypes,
  useArrangements,
  useSources,
  useTabs,
  useTabsSync,
  useTimeOfRecords,
} from "app/context/hooks";

const SaveLayoutButton = () => {
  const arrangements = useArrangements();
  const adTypes = useAdTypes();
  const sources = useSources();
  const tabs = useTabs();
  const tabsSync = useTabsSync();
  const timeOfRecords = useTimeOfRecords();

  async function onClick() {
    const sourcesWithBase64 = await Promise.all(
      sources.map(async (item) => ({
        ...item,
        // file: await toBase64(item.file),
      })),
    );

    const layout = JSON.stringify({
      arrangements: arrangements,
      adTypes: adTypes,
      sources: sourcesWithBase64,
      tabs: tabs,
      tabsSync: tabsSync,
      timeOfRecords: timeOfRecords,
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([layout], { type: "application/json" }),
    );

    link.download = `layout_${new Date().toDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }



  return (
    <Button onClick={onClick}>
      <Icon data={FloppyDisk} />
      Сохранить текущую расстановку
    </Button>
  );
};

export default SaveLayoutButton;
