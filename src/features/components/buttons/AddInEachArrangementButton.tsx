import { Button, Icon } from "@gravity-ui/uikit";
import { FilePlus } from "@gravity-ui/icons";
import { useDispatchAddInEachArrangementModalState } from "app/context/hooks";

const AddInEachArrangementButton = () => {
  const dispatchAddInEachArrangementModalState =
    useDispatchAddInEachArrangementModalState();

  function onClick() {
    dispatchAddInEachArrangementModalState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  }

  return (
    <Button onClick={onClick}>
      <Icon data={FilePlus} />
      Добавить объявление в каждую запись
    </Button>
  );
};

export default AddInEachArrangementButton;
