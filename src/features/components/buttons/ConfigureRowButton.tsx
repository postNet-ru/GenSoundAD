import { GearPlay } from "@gravity-ui/icons";
import { Button, Icon } from "@gravity-ui/uikit";
import { ComponentProps } from "react";

const ConfigureRowButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <Icon data={GearPlay} />
    </Button>
  );
};

export default ConfigureRowButton;
