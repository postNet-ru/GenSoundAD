import { Flex, Icon, Text } from "@gravity-ui/uikit";
import { VolumeFill } from "@gravity-ui/icons";

const Header = () => {
  return (
    <Flex
      gap={"2"}
      spacing={{ p: "4" }}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <Icon data={VolumeFill} size={25} />
      <Text variant="header-2">Генератор звуковых объявлений (Beta)</Text>
    </Flex>
  );
};

export default Header;
