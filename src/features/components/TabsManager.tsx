import { Plus, Xmark } from "@gravity-ui/icons";
import { Button, Card, Flex, Icon, Text } from "@gravity-ui/uikit";
import {
  useDispatchCreateNewTabModalState,
  useDispatchTabs,
  useTabs,
} from "app/context/hooks";
import CreateNewTab from "./modals/CreateNewTab";

const TabsManager = () => {
  const tabs = useTabs();
  const setTabs = useDispatchTabs();
  const dispatchCreateNewTab = useDispatchCreateNewTabModalState();

  function onClick() {
    dispatchCreateNewTab({ isOpen: true });
  }

  return (
    <Card spacing={{ p: "3" }} view="outlined">
      <CreateNewTab />
      <Flex direction={"column"} gap={"2"}>
        <Text variant="subheader-1">
          <b>Добавить новую запись</b>
        </Text>
        <Flex wrap alignItems={"center"} gap={"2"}>
          <Button onClick={onClick}>
            <Icon data={Plus} />
          </Button>
          {tabs.length
            ? tabs.map((item, id) => {
                return (
                  <Card key={id} spacing={{ p: "0.5", pl: 2 }}>
                    <Flex gap={"1"} alignItems={"center"}>
                      <Text>{item.title}</Text>
                      <Button
                        view="flat"
                        size="s"
                        onClick={() => {
                          const updatedAdTypes = tabs.filter((i) => {
                            if (i.id !== item.id) {
                              return i;
                            }
                          });
                          setTabs(updatedAdTypes);
                        }}
                      >
                        <Icon data={Xmark} size={10} />
                      </Button>
                    </Flex>
                  </Card>
                );
              })
            : null}
        </Flex>
      </Flex>
    </Card>
  );
};

export default TabsManager;
