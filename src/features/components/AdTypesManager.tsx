import { Plus, Xmark } from "@gravity-ui/icons";
import { Button, Card, Flex, Icon, Text } from "@gravity-ui/uikit";
import {
  useAdTypes,
  useDispatchAdTypes,
  useDispatchCreateNewAdTypeModalState,
} from "app/context/hooks";
import CreateNewAdType from "./modals/CreateNewAdType";

const AdTypesManager = () => {
  const adTypes = useAdTypes();
  const setAdTypes = useDispatchAdTypes();
  const dispatchCreateNewAdType = useDispatchCreateNewAdTypeModalState();

  function onClick() {
    dispatchCreateNewAdType({ isOpen: true });
  }

  return (
    <Card spacing={{ p: "3" }} view="outlined">
      <CreateNewAdType />
      <Flex direction={"column"} gap={"2"}>
        <Text variant="subheader-1">
          <b>Добавить тип объявления</b>
        </Text>
        <Flex wrap alignItems={"center"} gap={"2"}>
          <Button onClick={onClick}>
            <Icon data={Plus} />
          </Button>
          {adTypes.length
            ? adTypes.map((item, id) => {
                return (
                  <Card key={id} spacing={{ p: "0.5", pl: 2 }}>
                    <Flex gap={"1"} alignItems={"center"}>
                      <Text>{item.content}</Text>
                      <Button
                        view="flat"
                        size="s"
                        onClick={() => {
                          const updatedAdTypes = adTypes.filter((i) => {
                            if (i.value !== item.value) {
                              return i;
                            }
                          });
                          setAdTypes(updatedAdTypes);
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

export default AdTypesManager;
