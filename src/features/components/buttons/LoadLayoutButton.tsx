import { dateTime } from "@gravity-ui/date-utils";
import { FolderOpen } from "@gravity-ui/icons";
import { Button, Icon, useToaster } from "@gravity-ui/uikit";
import {
  useDispatchAdTypes,
  useDispatchArrangements,
  useDispatchSources,
  useDispatchTabs,
  useDispatchTabsSync,
  useDispatchTimeOfRecords,
} from "app/context/hooks";
import { AdType, Arrangement, Source, Tab, TabsSync, Arrangements, TimeOfRecords } from "app/context/types";

interface LoadedArrangement {
  playingTime: { start: string; end: string };
  typeId: Source["typeId"];
  id: string;
  fadeIn: boolean;
  fadeOut: boolean;
  fixedTime: "end" | "start" | null;
  loudness: number;
}

interface LayoutData {
  sources: Array<Omit<Source, 'file'>>;
  arrangements: Record<string, LoadedArrangement[]>;
  timeOfRecords: Record<string, {
    start: string;
    end: string;
  }>;
  tabs: Tab[];
  adTypes: AdType[];
  tabsSync: TabsSync;
}

const LoadLayoutButton = () => {
  const dispatchAdTypes = useDispatchAdTypes();
  const dispatchArrangements = useDispatchArrangements();
  const dispatchSources = useDispatchSources();
  const dispatchTabs = useDispatchTabs();
  const dispatchTabsSync = useDispatchTabsSync();
  const dispatchTimeOfRecords = useDispatchTimeOfRecords();

  const toaster = useToaster();

  async function loadLayout() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      if (!input.files?.length) {
        toaster.add({
          title: "Ошибка при загрузке файла",
          theme: "danger",
          name: "error",
          autoHiding: 2000,
        });
        return;
      }
      const file = input.files[0];
      const layout = await file.text();
      const loadedLayout = JSON.parse(layout) as LayoutData;

      const updatedSources = loadedLayout.sources.map((source: Omit<Source, 'file'>): Source => {
        return {
          ...source,
          // Временная заглушка для файла, поскольку файлы не сохраняются в JSON
          file: new File([], source.title, { type: 'audio/mpeg' }),
          // file: fromBase64(source.file, source.title),
        };
      });

      const updatedArrangements: Arrangements = {};

      for (const key in loadedLayout.arrangements) {
        updatedArrangements[key] = loadedLayout.arrangements[key].map(
          (arrangement: LoadedArrangement): Arrangement => ({
            ...arrangement,
            playingTime: {
              start: dateTime({ input: arrangement.playingTime.start }),
              end: dateTime({ input: arrangement.playingTime.end }),
            },
          }),
        );
      }

      const updatedTimeOfRecords: TimeOfRecords = {};
      for (const key in loadedLayout.timeOfRecords) {
        updatedTimeOfRecords[key] = {
          start: dateTime({ input: loadedLayout.timeOfRecords[key].start }),
          end: dateTime({ input: loadedLayout.timeOfRecords[key].end }),
        };
      }

      dispatchAdTypes(loadedLayout.adTypes);
      dispatchArrangements(updatedArrangements);
      dispatchSources(updatedSources);
      dispatchTabs(loadedLayout.tabs);
      dispatchTabsSync(loadedLayout.tabsSync);
      dispatchTimeOfRecords(updatedTimeOfRecords);
    };
    input.click();
  }

  // function fromBase64(dataUrl: string, filename: string): File { // eslint-disable-line
  //   const [meta, base64] = dataUrl.split(",");
  //   const mime =
  //     meta.match(/data:(.*);base64/)?.[1] || "application/octet-stream";

  //   const byteString = atob(base64);
  //   const byteArray = new Uint8Array(byteString.length);
  //   for (let i = 0; i < byteString.length; i++) {
  //     byteArray[i] = byteString.charCodeAt(i);
  //   }

  //   return new File([byteArray], filename, { type: mime });
  // }

  return (
    <Button onClick={loadLayout}>
      <Icon data={FolderOpen} />
      Загрузить расстановку
    </Button>
  );
};

export default LoadLayoutButton;
