import CustomModal from "./CustomModal";
import { Button, Flex, TextInput, useToaster } from "@gravity-ui/uikit";
import {
  useCreateNewAdTypeModalState,
  useDispatchAdTypes,
  useDispatchCreateNewAdTypeModalState,
} from "app/context/hooks";
import { useState } from "react";
import { v7 } from "uuid";

const CreateNewTab = () => {
  const createNewAdType = useCreateNewAdTypeModalState();
  const dispatchCreateNewAdType = useDispatchCreateNewAdTypeModalState();
  const [adTypeTitle, setAdTypeTitle] = useState("");
  const dispatchAdTypes = useDispatchAdTypes();
  const toaster = useToaster();

  function onCancle() {
    setAdTypeTitle("");
    dispatchCreateNewAdType({ isOpen: false });
  }
  function onSave() {
    if (!adTypeTitle) {
      toaster.add({
        name: "error",
        title: "Название типа объявления не может быть пустым",
        theme: "danger",
        autoHiding: 2000,
      });
    } else {
      const value = v7();
      dispatchAdTypes((prev) => [
        ...prev,
        { value: value, content: adTypeTitle },
      ]);
      onCancle();
    }
  }

  function onChange(value: string) {
    setAdTypeTitle(value);
  }

  return (
    <CustomModal
      title="Создание нового типа объявления"
      state={createNewAdType}
      setState={dispatchCreateNewAdType}
    >
      <Flex style={{ width: "100%" }} direction={"column"} gap={"2"}>
        <TextInput
          placeholder="Название типа объявления"
          style={{ width: "100%" }}
          onUpdate={onChange}
        />
        <Flex gap={"2"}>
          <Button onClick={onCancle}>Отмена</Button>
          <Button onClick={onSave}>Сохранить</Button>
        </Flex>
      </Flex>
    </CustomModal>
  );
};

export default CreateNewTab;
