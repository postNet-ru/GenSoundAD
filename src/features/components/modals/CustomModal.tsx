import { Button, Card, Flex, Icon, Modal, Text } from "@gravity-ui/uikit";
import { Xmark } from "@gravity-ui/icons";
import { Modal as IModal } from "app/context/types";
import { ReactNode } from "react";

type CustomModalProps<T extends IModal> = {
  children: ReactNode;
  state: T;
  setState: React.Dispatch<React.SetStateAction<T>>;
  title: string;
};

const CustomModal = <T extends IModal>({
  children,
  state,
  setState,
  title,
}: CustomModalProps<T>) => {
  function onOpenChange() {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }

  function closeModal() {
    setState((prev) => ({ ...prev, isOpen: false }));
  }

  return (
    <Modal open={state.isOpen} onOpenChange={onOpenChange}>
      <Card view="raised" spacing={{ p: "4" }} minWidth={250}>
        <Flex direction={"column"} gap={"2"}>
          <Flex
            gap={"2"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Text variant="header-1">{title}</Text>
            <Button onClick={closeModal} size="m">
              <Icon data={Xmark} />
            </Button>
          </Flex>
          <Flex alignItems={"center"} justifyContent={"center"} width={"100%"}>
            {children}
          </Flex>
        </Flex>
      </Card>
    </Modal>
  );
};

export default CustomModal;
