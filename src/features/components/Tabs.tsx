import { Tab, TabList, TabPanel, TabProvider } from "@gravity-ui/uikit";
import TabPanelContent from "./TabPanelContent";
import { useTabs, useTabsSync } from "app/context/hooks";

const Tabs = ({
  value,
  onUpdate,
}: {
  value: string;
  onUpdate: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const tabs = useTabs();
  const tabsSync = useTabsSync();
  return (
    <TabProvider value={value} onUpdate={onUpdate}>
      <TabList>
        {tabs.length
          ? tabs.map((item, id) => (
              <Tab value={item.id} key={id}>
                {item.title}
              </Tab>
            ))
          : null}
      </TabList>
      {tabs.length
        ? tabs.map((item, id) => {
            return (
              <TabPanel value={item.id} key={id}>
                <TabPanelContent day={tabsSync[item.id]} />
              </TabPanel>
            );
          })
        : null}
    </TabProvider>
  );
};

export default Tabs;
