import { Container, Flex } from "@gravity-ui/uikit";
import { Header, Stage1, Stage2, Stage3, Player } from "features/components";
import PlayerRow from "features/components/PlayerRow";

const Index = () => {
  return (
    <Container
      style={{
        position: "relative",
        minHeight: "100dvh",
        marginBottom: "160px",
      }}
      maxWidth="xl"
    >
      <Flex direction={"column"} gap={"2"} spacing={{ p: "3" }}>
        <Player />
        <Header />
        <Stage1 />
        <Stage2 />
        <Stage3 />
      </Flex>
      <PlayerRow />
    </Container>
  );
};

export default Index;
