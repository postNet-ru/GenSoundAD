import { DispatchPlayer, Player } from "app/context/types";

export function play(
  dispatchPlayer: DispatchPlayer,
  props: Omit<Player, "isPlaying">,
) {
  dispatchPlayer((prev) => ({ ...prev, ...props, isPlaying: "ready" }));
}

export function pause(
  dispatchPlayer: DispatchPlayer,
  props: Omit<Player, "isPlaying">,
) {
  dispatchPlayer((prev) => ({ ...prev, ...props, isPlaying: "pause" }));
}
