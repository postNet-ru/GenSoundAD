import { DateTime } from "@gravity-ui/date-utils";

export type ExportSettings = {
  bitrate: number;
  extension: string;
};

export type Source = {
  title: string;
  file: File;
  id: string;
  typeId: AdType["value"] | null;
  cut: {
    start: number;
    end: number;
  };
};

export type Arrangement = {
  playingTime: {
    start: DateTime;
    end: DateTime;
  };
  typeId: Source["typeId"];
  id: string;
  fadeIn: boolean;
  fadeOut: boolean;
  fixedTime: "end" | "start" | null;
  loudness: number;
};

export type Arrangements = {
  [key: string]: Arrangement[];
};

export type Player = {
  isPlaying: "play" | "ready" | "pause" | "idle";
  type: "primary" | "secondary";
  primary: {
    now: number;
    duration: number;
    playingNow: Arrangement | null;
    arrangementsKey: string;
  };
  secondary: {
    sourceId: string | null;
    file: Blob | null;
  };
};

export type Modal = {
  isOpen: boolean;
};

export interface CutModalState extends Modal {
  isOpen: boolean;
  sourceId: Source["id"] | null;
}

export interface ConfigureModalState extends Modal {
  isOpen: boolean;
  day: string | null;
  arrangementId: Arrangement["id"] | null;
}

export type AdType = {
  content: string;
  value: string;
};
export type AdTypes = AdType[];

export type Tab = {
  id: string;
  title: string;
};
export type Tabs = Tab[];

export type TabsSync = {
  [key: string]: string;
};

export type CreateNewTabModalState = Modal;
export type CreateNewAdTypeModalState = Modal;
export type AddInEachArrangementModalState = Modal;

export type TimeOfRecord = {
  start: DateTime;
  end: DateTime;
};
export type TimeOfRecords = {
  [key: string]: TimeOfRecord;
};

export type DispatchSources = React.Dispatch<React.SetStateAction<Source[]>>;
export type DispatchArrangements = React.Dispatch<
  React.SetStateAction<Arrangements>
>;
export type DispatchPlayer = React.Dispatch<React.SetStateAction<Player>>;
export type DispatchModal = React.Dispatch<React.SetStateAction<Modal>>;
export type DispatchCutModalState = React.Dispatch<
  React.SetStateAction<CutModalState>
>;
export type DispatchConfigureModalState = React.Dispatch<
  React.SetStateAction<ConfigureModalState>
>;
export type DispatchAdTypes = React.Dispatch<React.SetStateAction<AdTypes>>;
export type DispatchTabs = React.Dispatch<React.SetStateAction<Tabs>>;
export type DispatchTabsSync = React.Dispatch<React.SetStateAction<TabsSync>>;
export type DispatchCreateNewTabModalState = React.Dispatch<
  React.SetStateAction<Modal>
>;
export type DispatchCreateNewAdTypeModalState = React.Dispatch<
  React.SetStateAction<Modal>
>;
export type DispatchAddInEachArrangementModalState = React.Dispatch<
  React.SetStateAction<Modal>
>;
export type DispatchTimeOfRecords = React.Dispatch<
  React.SetStateAction<TimeOfRecords>
>;
export type DispatchExportSettings = React.Dispatch<
  React.SetStateAction<ExportSettings>
>;
export type DispatchActiveTab = React.Dispatch<React.SetStateAction<string>>;
