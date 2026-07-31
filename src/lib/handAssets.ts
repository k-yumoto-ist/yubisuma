import type { ThumbSide } from "./handVisual";

export type HandAssetPose = "fist" | "thumb-up";

const assetRoot = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/assets/hands`;

export function getHandAssetPath(side: ThumbSide, pose: HandAssetPose): string {
  return `${assetRoot}/${pose === "fist" ? "fist" : "thumb-up"}-${side}.png`;
}
