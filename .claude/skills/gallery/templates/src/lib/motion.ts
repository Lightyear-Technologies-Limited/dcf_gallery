import motionData from "./motion.data.json";

/**
 * Playback config per piece. Populated by the pipeline (or hand-edited)
 * for animated / interactive pieces. Absent = still-only.
 *
 * Types:
 *   - "video"       — pinned .mp4/.webm URL. Rendered as muted looping <video>.
 *   - "gif"         — animated GIF URL. Rendered as <img>.
 *   - "interactive" — sandboxed HTML URL. Rendered as <iframe sandbox="allow-scripts">.
 */
export type MotionEntry =
  | { type: "video"; src: string }
  | { type: "gif"; src: string }
  | { type: "interactive"; src: string };

const data = motionData as Record<string, MotionEntry>;

export function getMotion(slug: string): MotionEntry | null {
  return data[slug] || null;
}
