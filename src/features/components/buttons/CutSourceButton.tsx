import { ChevronsCollapseToLine } from "@gravity-ui/icons";
import { Button, Icon } from "@gravity-ui/uikit";

const CutSourceButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button onClick={onClick}>
      <Icon data={ChevronsCollapseToLine} />
      Обрезать
    </Button>
  );
};

export default CutSourceButton;
