import type { ThumbSide } from "./handVisual";

export type HandAssetPose = "fist" | "thumb-up";

const assetRoot = "/assets/hands";

export function getHandAssetPath(side: ThumbSide, pose: HandAssetPose): string {
  return `${assetRoot}/${pose === "fist" ? "fist" : "thumb-up"}-${side}.png`;
}
