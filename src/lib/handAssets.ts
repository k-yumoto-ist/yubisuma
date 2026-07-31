import type { ThumbSide } from "./handVisual";

export type HandAssetPose = "fist" | "thumb-up";

const assetRoot = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/assets/hands`;

export function getHandAssetPath(_side: ThumbSide, pose: HandAssetPose): string {
  // Both slots intentionally use the same completed right-hand asset.
  // The left slot mirrors it at render time so the two hands cannot drift apart.
  return `${assetRoot}/${pose === "fist" ? "fist" : "thumb-up"}-right.png`;
}
