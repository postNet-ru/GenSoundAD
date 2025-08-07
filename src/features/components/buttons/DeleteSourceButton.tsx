import { Xmark } from "@gravity-ui/icons";
import { Button, Icon } from "@gravity-ui/uikit";

const DeleteSourceButtonButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button onClick={onClick}>
      <Icon data={Xmark} />
    </Button>
  );
};

export default DeleteSourceButtonButton;
