import { createContext } from "react";
import {
  AddInEachArrangementModalState,
  AdTypes,
  Arrangements,
  ConfigureModalState,
  CreateNewAdTypeModalState,
  CreateNewTabModalState,
  CutModalState,
  DispatchAddInEachArrangementModalState,
  DispatchActiveTab,
  DispatchAdTypes,
  DispatchArrangements,
  DispatchConfigureModalState,
  DispatchCreateNewAdTypeModalState,
  DispatchCreateNewTabModalState,
  DispatchCutModalState,
  DispatchExportSettings,
  DispatchPlayer,
  DispatchSources,
  DispatchTabs,
  DispatchTabsSync,
  DispatchTimeOfRecords,
  ExportSettings,
  Player,
  Source,
  Tabs,
  TabsSync,
  TimeOfRecords,
} from "./types";

// ExportSettings
const ExportSettingsContext = createContext<ExportSettings>({
  bitrate: 192,
  extension: "mp3",
});

const DispatchExportSettingsContext = createContext<DispatchExportSettings>(
  () => {},
);

// sources
const SourcesContext = createContext<Source[]>([]);

const DispatchSourcesContext = createContext<DispatchSources>(() => {});

// arrangements
const ArrangementsContext = createContext<Arrangements>({
  monday: [],
  saturday: [],
  weekdays: [],
});

const DispatchArrangementsContext = createContext<DispatchArrangements>(
  () => {},
);

// player
const PlayerContext = createContext<Player>({
  isPlaying: "idle",
  type: "primary",
  primary: { now: 0, playingNow: null, duration: 0, arrangementsKey: "monday" },
  secondary: { sourceId: null, file: null },
});

const DispatchPlayerContext = createContext<DispatchPlayer>(() => {});

// CutModalState
const CutModalStateContext = createContext<CutModalState>({
  isOpen: false,
  sourceId: "",
});

const DispatchCutModalStateContext = createContext<DispatchCutModalState>(
  () => {},
);

// ConfigureModalState
const ConfigureModalStateContext = createContext<ConfigureModalState>({
  isOpen: false,
  day: null,
  arrangementId: null,
});

const DispatchConfigureModalStateContext =
  createContext<DispatchConfigureModalState>(() => {});

// CreateNewTabModalState
const CreateNewTabModalStateContext = createContext<CreateNewTabModalState>({
  isOpen: false,
});

const DispatchCreateNewTabModalStateContext =
  createContext<DispatchCreateNewTabModalState>(() => {});

// CreateNewAdTypeModalState
const CreateNewAdTypeModalStateContext =
  createContext<CreateNewAdTypeModalState>({
    isOpen: false,
  });

const DispatchCreateNewAdTypeModalStateContext =
  createContext<DispatchCreateNewAdTypeModalState>(() => {});

// AdTypes
const AdTypesContext = createContext<AdTypes>([]);

const DispatchAdTypesContext = createContext<DispatchAdTypes>(() => {});

// Tabs
const TabsContext = createContext<Tabs>([]);

const DispatchTabsContext = createContext<DispatchTabs>(() => {});

// TabsSync
const TabsSyncContext = createContext<TabsSync>({});
const DispatchTabsSyncContext = createContext<DispatchTabsSync>(() => {});

// AddInEachArrangementModalState
const AddInEachArrangementModalStateContext =
  createContext<AddInEachArrangementModalState>({ isOpen: false });

const DispatchAddInEachArrangementModalStateContext =
  createContext<DispatchAddInEachArrangementModalState>(() => {});

// TimeOfRecords
const TimeOfRecordsContext = createContext<TimeOfRecords>({});
const DispatchTimeOfRecordsContext = createContext<DispatchTimeOfRecords>(
  () => {},
);

// ActiveTab
const ActiveTabContext = createContext<string>("monday");
const DispatchActiveTabContext = createContext<DispatchActiveTab>(() => {});

export {
  SourcesContext,
  DispatchSourcesContext,
  ArrangementsContext,
  DispatchArrangementsContext,
  PlayerContext,
  DispatchPlayerContext,
  CutModalStateContext,
  DispatchCutModalStateContext,
  ConfigureModalStateContext,
  DispatchConfigureModalStateContext,
  AdTypesContext,
  DispatchAdTypesContext,
  TabsContext,
  DispatchTabsContext,
  TabsSyncContext,
  DispatchTabsSyncContext,
  CreateNewTabModalStateContext,
  DispatchCreateNewTabModalStateContext,
  CreateNewAdTypeModalStateContext,
  DispatchCreateNewAdTypeModalStateContext,
  AddInEachArrangementModalStateContext,
  DispatchAddInEachArrangementModalStateContext,
  TimeOfRecordsContext,
  DispatchTimeOfRecordsContext,
  ExportSettingsContext,
  DispatchExportSettingsContext,
  ActiveTabContext,
  DispatchActiveTabContext,
};
