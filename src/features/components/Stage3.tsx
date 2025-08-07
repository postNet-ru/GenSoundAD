import { Card, Flex, Select, Text } from "@gravity-ui/uikit";
import { typeExtSelectOptions, typeBitraitSelectOptions } from "shared/data";
import SaveButton from "./buttons/SaveButton";
import {
  useDispatchExportSettings,
  useExportSettings,
} from "app/context/hooks";

const Stage3 = () => {
  const exportSettings = useExportSettings();
  const dispatchExportSettings = useDispatchExportSettings();

  function onUpdateBitrate(value: string[]) {
    dispatchExportSettings({
      ...exportSettings,
      bitrate: Number(value[0]),
    });
  }
  function onUpdateFormat(value: string[]) {
    dispatchExportSettings({
      ...exportSettings,
      extension: value[0],
    });
  }
  return (
    <Card spacing={{ p: "4" }}>
      <Flex direction={"column"} style={{ width: "max-content" }} gap={"2"}>
        <Text variant="body-3">3. Параметры</Text>
        <Select
          value={[exportSettings.extension]}
          onUpdate={onUpdateFormat}
          label="Формат выходного файла"
          options={typeExtSelectOptions}
        />
        <Select
          value={[String(exportSettings.bitrate)]}
          onUpdate={onUpdateBitrate}
          label="Битрейт"
          options={typeBitraitSelectOptions}
        />
        <SaveButton />
      </Flex>
    </Card>
  );
};

export default Stage3;
