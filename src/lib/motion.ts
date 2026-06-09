// Unified client motion map (E.1): which pieces have playable motion and its
// source + kind. Generated from the provenance manifest by scripts/build-motion.mjs
// (small — gateway URLs only), so the heavy manifest stays server-only.
//
//  - "video"        → a pinned 1080p transcode (plays in a <video>)
//  - "gif"          → an animated GIF served from its plain CID (plays in an <img>)
//  - "interactive"  → on-chain HTML pinned to the gateway (runs in a sandboxed iframe)
import motion from "./motion.data.json";

export type MotionType = "video" | "gif" | "interactive";
export interface Motion {
  type: MotionType;
  src: string;
}

const M = motion as Record<string, Motion>;

export function getMotion(slug: string): Motion | undefined {
  return M[slug];
}

export function hasMotion(slug: string): boolean {
  return slug in M;
}
