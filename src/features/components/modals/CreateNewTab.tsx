import { dateTime } from "@gravity-ui/date-utils";
import CustomModal from "./CustomModal";
import { Button, Flex, TextInput, useToaster } from "@gravity-ui/uikit";
import {
  useCreateNewTabModalState,
  useDispatchArrangements,
  useDispatchCreateNewTabModalState,
  useDispatchTabs,
  useDispatchTabsSync,
  useDispatchTimeOfRecords,
  useTabs,
} from "app/context/hooks";
import { TabsSync } from "app/context/types";
import { useState } from "react";
import { v7 } from "uuid";

const CreateNewTab = () => {
  const tabs = useTabs();
  const setTabs = useDispatchTabs();
  const createNewTab = useCreateNewTabModalState();
  const dispatchCreateNewTab = useDispatchCreateNewTabModalState();
  const dispathcArrangements = useDispatchArrangements();
  const dispatchTabsSync = useDispatchTabsSync();
  const [tabTitle, setTabTitle] = useState("");
  const dispatchTimeOfRecords = useDispatchTimeOfRecords();
  const toaster = useToaster();

  function onCancle() {
    setTabTitle("");
    dispatchCreateNewTab({ isOpen: false });
  }
  function onSave() {
    if (!tabTitle) {
      toaster.add({
        name: "error",
        title: "Название записи не может быть пустым",
        theme: "danger",
        autoHiding: 2000,
      });
    } else {
      const dateStart = new Date().setHours(0, 0, 0, 0);
      const tabId = v7();
      setTabs([...tabs, { title: tabTitle, id: tabId }]);
      dispathcArrangements((prev) => ({ ...prev, [tabId]: [] }));
      dispatchTabsSync((prev: TabsSync) => ({ ...prev, [tabId]: tabId }));
      dispatchTimeOfRecords((prev) => ({
        ...prev,
        [tabId]: { start: dateTime({ input: dateStart }), end: dateTime() },
      }));
      onCancle();
    }
  }

  function onChange(value: string) {
    setTabTitle(value);
  }

  return (
    <CustomModal
      title="Создание новой записи"
      state={createNewTab}
      setState={dispatchCreateNewTab}
    >
      <Flex style={{ width: "100%" }} direction={"column"} gap={"2"}>
        <TextInput
          placeholder="Название записи"
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
