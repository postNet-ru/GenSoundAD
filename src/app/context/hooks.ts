import { useContext } from "react";
import {
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
  DispatchCreateNewTabModalStateContext,
  CreateNewTabModalStateContext,
  CreateNewAdTypeModalStateContext,
  DispatchCreateNewAdTypeModalStateContext,
  AddInEachArrangementModalStateContext,
  DispatchAddInEachArrangementModalStateContext,
  DispatchTimeOfRecordsContext,
  TimeOfRecordsContext,
  DispatchExportSettingsContext,
  ExportSettingsContext,
  ActiveTabContext,
  DispatchActiveTabContext,
} from "./context";

export const usePlayer = () => useContext(PlayerContext);
export const useDispatchPlayer = () => useContext(DispatchPlayerContext);

export const useSources = () => useContext(SourcesContext);
export const useDispatchSources = () => useContext(DispatchSourcesContext);

export const useArrangements = () => useContext(ArrangementsContext);
export const useDispatchArrangements = () =>
  useContext(DispatchArrangementsContext);

export const useCutModalState = () => useContext(CutModalStateContext);
export const useDispatchCutModalState = () =>
  useContext(DispatchCutModalStateContext);

export const useConfigureModalState = () =>
  useContext(ConfigureModalStateContext);
export const useDispatchConfigureModalState = () =>
  useContext(DispatchConfigureModalStateContext);

export const useAdTypes = () => useContext(AdTypesContext);
export const useDispatchAdTypes = () => useContext(DispatchAdTypesContext);

export const useTabs = () => useContext(TabsContext);
export const useDispatchTabs = () => useContext(DispatchTabsContext);

export const useTabsSync = () => useContext(TabsSyncContext);
export const useDispatchTabsSync = () => useContext(DispatchTabsSyncContext);

export const useCreateNewTabModalState = () =>
  useContext(CreateNewTabModalStateContext);
export const useDispatchCreateNewTabModalState = () =>
  useContext(DispatchCreateNewTabModalStateContext);

export const useCreateNewAdTypeModalState = () =>
  useContext(CreateNewAdTypeModalStateContext);
export const useDispatchCreateNewAdTypeModalState = () =>
  useContext(DispatchCreateNewAdTypeModalStateContext);

export const useTimeOfRecords = () => useContext(TimeOfRecordsContext);
export const useDispatchTimeOfRecords = () =>
  useContext(DispatchTimeOfRecordsContext);

export const useAddInEachArrangementModalState = () =>
  useContext(AddInEachArrangementModalStateContext);
export const useDispatchAddInEachArrangementModalState = () =>
  useContext(DispatchAddInEachArrangementModalStateContext);

export const useExportSettings = () => useContext(ExportSettingsContext);
export const useDispatchExportSettings = () =>
  useContext(DispatchExportSettingsContext);

export const useActiveTab = () => useContext(ActiveTabContext);
export const useDispatchActiveTab = () => useContext(DispatchActiveTabContext);
