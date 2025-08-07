import { ReactNode, useState } from "react";
import { Toaster, ToasterComponent, ToasterProvider } from "@gravity-ui/uikit";
import {
  AddInEachArrangementModalStateContext,
  ActiveTabContext,
  AdTypesContext,
  ArrangementsContext,
  ConfigureModalStateContext,
  CreateNewAdTypeModalStateContext,
  CreateNewTabModalStateContext,
  CutModalStateContext,
  DispatchActiveTabContext,
  DispatchAddInEachArrangementModalStateContext,
  DispatchAdTypesContext,
  DispatchArrangementsContext,
  DispatchConfigureModalStateContext,
  DispatchCreateNewAdTypeModalStateContext,
  DispatchCreateNewTabModalStateContext,
  DispatchCutModalStateContext,
  DispatchExportSettingsContext,
  DispatchPlayerContext,
  DispatchSourcesContext,
  DispatchTabsContext,
  DispatchTabsSyncContext,
  DispatchTimeOfRecordsContext,
  ExportSettingsContext,
  PlayerContext,
  SourcesContext,
  TabsContext,
  TabsSyncContext,
  TimeOfRecordsContext,
} from "./context";
import {
  AddInEachArrangementModalState,
  AdTypes,
  Arrangements,
  ConfigureModalState,
  CreateNewAdTypeModalState,
  CreateNewTabModalState,
  CutModalState,
  ExportSettings,
  Player,
  Source,
  Tabs,
  TabsSync,
  TimeOfRecords,
} from "./types";
import { v7 } from "uuid";
import { dateTime } from "@gravity-ui/date-utils";

const ContextProvider = ({ children }: { children: ReactNode }) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [tabsSync, setTabsSync] = useState<TabsSync>({
    monday: "monday",
    weekdays: "weekdays",
    saturday: "saturday",
  });
  const [arrangements, setArrangements] = useState<Arrangements>({
    monday: [],
    weekdays: [],
    saturday: [],
  });
  const [tabs, setTabs] = useState<Tabs>([
    { title: "Понедельник", id: "monday" },
    { title: "Будни", id: "weekdays" },
    { title: "Суббота", id: "saturday" },
  ]);

  const [player, setPlayer] = useState<Player>({
    isPlaying: "idle",
    type: "primary",
    primary: {
      now: 0,
      playingNow: null,
      duration: 0,
      arrangementsKey: "monday",
    },
    secondary: {
      sourceId: null,
      file: null,
    },
  });
  const [cutState, setCutState] = useState<CutModalState>({
    isOpen: false,
    sourceId: null,
  });
  const [configureState, setConfigureState] = useState<ConfigureModalState>({
    isOpen: false,
    day: null,
    arrangementId: null,
  });
  const [createNewTab, setCreateNewTab] = useState<CreateNewTabModalState>({
    isOpen: false,
  });

  const [createNewAdType, setCreateNewAdType] =
    useState<CreateNewAdTypeModalState>({
      isOpen: false,
    });

  const [adTypes, setAdTypes] = useState<AdTypes>([
    {
      value: v7(),
      content: "Звонок на урок",
    },
    {
      value: v7(),
      content: "Звонок с урока",
    },
    {
      value: v7(),
      content: "Гимны",
    },
  ]);

  const [addInEachArrangementModalState, setAddInEachArrangementModalState] =
    useState<AddInEachArrangementModalState>({ isOpen: false });

  const [timeOfRecords, setTimeOfRecords] = useState<TimeOfRecords>({
    monday: {
      start: dateTime({
        input: new Date().setHours(0, 0, 0, 0),
        format: "HH:mm:ss",
      }),
      end: dateTime({ input: new Date(), format: "HH:mm:ss" }),
    },
    weekdays: {
      start: dateTime({
        input: new Date().setHours(0, 0, 0, 0),
        format: "HH:mm:ss",
      }),
      end: dateTime({ input: new Date(), format: "HH:mm:ss" }),
    },
    saturday: {
      start: dateTime({
        input: new Date().setHours(0, 0, 0, 0),
        format: "HH:mm:ss",
      }),
      end: dateTime({ input: new Date(), format: "HH:mm:ss" }),
    },
  });

  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    bitrate: 192,
    extension: "mp3",
  });

  const [activeTab, setActiveTab] = useState<string>("monday");

  const toaster = new Toaster();

  return (
    <ToasterProvider toaster={toaster}>
      <ToasterComponent />
      <DispatchSourcesContext.Provider value={setSources}>
        <SourcesContext.Provider value={sources}>
          <DispatchArrangementsContext.Provider value={setArrangements}>
            <ArrangementsContext.Provider value={arrangements}>
              <DispatchPlayerContext.Provider value={setPlayer}>
                <PlayerContext.Provider value={player}>
                  <DispatchCutModalStateContext.Provider value={setCutState}>
                    <CutModalStateContext.Provider value={cutState}>
                      <DispatchConfigureModalStateContext.Provider
                        value={setConfigureState}
                      >
                        <ConfigureModalStateContext.Provider
                          value={configureState}
                        >
                          <DispatchAdTypesContext.Provider value={setAdTypes}>
                            <AdTypesContext.Provider value={adTypes}>
                              <DispatchTabsContext.Provider value={setTabs}>
                                <TabsContext.Provider value={tabs}>
                                  <DispatchTabsSyncContext.Provider
                                    value={setTabsSync}
                                  >
                                    <TabsSyncContext.Provider value={tabsSync}>
                                      <DispatchCreateNewTabModalStateContext.Provider
                                        value={setCreateNewTab}
                                      >
                                        <CreateNewTabModalStateContext.Provider
                                          value={createNewTab}
                                        >
                                          <DispatchCreateNewAdTypeModalStateContext.Provider
                                            value={setCreateNewAdType}
                                          >
                                            <CreateNewAdTypeModalStateContext.Provider
                                              value={createNewAdType}
                                            >
                                              <DispatchAddInEachArrangementModalStateContext.Provider
                                                value={
                                                  setAddInEachArrangementModalState
                                                }
                                              >
                                                <AddInEachArrangementModalStateContext.Provider
                                                  value={
                                                    addInEachArrangementModalState
                                                  }
                                                >
                                                  <DispatchTimeOfRecordsContext.Provider
                                                    value={setTimeOfRecords}
                                                  >
                                                    <TimeOfRecordsContext.Provider
                                                      value={timeOfRecords}
                                                    >
                                                      <ExportSettingsContext.Provider
                                                        value={exportSettings}
                                                      >
                                                        <DispatchExportSettingsContext.Provider
                                                          value={
                                                            setExportSettings
                                                          }
                                                        >
                                                          <DispatchActiveTabContext.Provider
                                                            value={setActiveTab}
                                                          >
                                                            <ActiveTabContext.Provider
                                                              value={activeTab}
                                                            >
                                                              {children}
                                                            </ActiveTabContext.Provider>
                                                          </DispatchActiveTabContext.Provider>
                                                        </DispatchExportSettingsContext.Provider>
                                                      </ExportSettingsContext.Provider>
                                                    </TimeOfRecordsContext.Provider>
                                                  </DispatchTimeOfRecordsContext.Provider>
                                                </AddInEachArrangementModalStateContext.Provider>
                                              </DispatchAddInEachArrangementModalStateContext.Provider>
                                            </CreateNewAdTypeModalStateContext.Provider>
                                          </DispatchCreateNewAdTypeModalStateContext.Provider>
                                        </CreateNewTabModalStateContext.Provider>
                                      </DispatchCreateNewTabModalStateContext.Provider>
                                    </TabsSyncContext.Provider>
                                  </DispatchTabsSyncContext.Provider>
                                </TabsContext.Provider>
                              </DispatchTabsContext.Provider>
                            </AdTypesContext.Provider>
                          </DispatchAdTypesContext.Provider>
                        </ConfigureModalStateContext.Provider>
                      </DispatchConfigureModalStateContext.Provider>
                    </CutModalStateContext.Provider>
                  </DispatchCutModalStateContext.Provider>
                </PlayerContext.Provider>
              </DispatchPlayerContext.Provider>
            </ArrangementsContext.Provider>
          </DispatchArrangementsContext.Provider>
        </SourcesContext.Provider>
      </DispatchSourcesContext.Provider>
    </ToasterProvider>
  );
};

export default ContextProvider;
