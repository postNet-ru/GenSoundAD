import { DateField } from "@gravity-ui/date-components";
import { ComponentProps } from "react";

const CustomDateField = (props: ComponentProps<typeof DateField>) => {
  return (
    <DateField
      value={props.value}
      style={{ width: "max-content" }}
      label={props.label}
      placeholder={props.placeholder}
      onUpdate={props.onUpdate}
      format="HH:mm:ss"
      validationState={props.validationState || undefined}
      errorMessage={props.errorMessage || undefined}
      errorPlacement="inside"
    />
  );
};

export default CustomDateField;
