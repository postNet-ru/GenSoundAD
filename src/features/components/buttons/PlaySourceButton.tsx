import { CirclePlay, CirclePause } from "@gravity-ui/icons";
import { Button, Icon } from "@gravity-ui/uikit";
import { useDispatchPlayer, usePlayer } from "app/context/hooks";
import { Source } from "app/context/types";
import { pause, play } from "shared/player";

const PlaySourceButton = ({ item }: { item: Source }) => {
  const player = usePlayer();
  const dispatchPlayer = useDispatchPlayer();

  function onClick() {
    const isSameSource = player.secondary.sourceId === item.id;

    if (player.isPlaying === "idle") {
      play(dispatchPlayer, {
        ...player,
        type: "secondary",
        secondary: { sourceId: item.id, file: item.file },
      });
    }

    if (isSameSource) {
      if (player.isPlaying === "play") {
        if (player.type === "primary") {
          play(dispatchPlayer, {
            ...player,
            type: "secondary",
            secondary: { sourceId: item.id, file: item.file },
          });
        } else {
          pause(dispatchPlayer, { ...player, type: "secondary" });
        }
      } else {
        play(dispatchPlayer, {
          ...player,
          type: "secondary",
          secondary: { sourceId: item.id, file: item.file },
        });
      }
    } else {
      play(dispatchPlayer, {
        ...player,
        type: "secondary",
        secondary: { sourceId: item.id, file: item.file },
      });
    }
  }

  return (
    <Button onClick={onClick}>
      <Icon
        data={
          player.isPlaying === "play" &&
          player.type === "secondary" &&
          player.secondary.sourceId === item.id
            ? CirclePause
            : CirclePlay
        }
      />
    </Button>
  );
};

export default PlaySourceButton;
