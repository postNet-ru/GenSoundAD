import { Xmark } from "@gravity-ui/icons";
import { Button, Icon } from "@gravity-ui/uikit";
import { ComponentProps } from "react";

const DeleteConfigureRowButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <Icon data={Xmark} />
    </Button>
  );
};

export default DeleteConfigureRowButton;
