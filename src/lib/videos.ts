// Client-safe video map (E.1). Slug → gateway URL of the piece's playable 1080p
// H.264 transcode (generated from the provenance manifest by pin-videos.mjs; the
// heavy master is never served). Small enough (~50 entries) for the client bundle;
// the full manifest stays server-only in provenance.ts.
import videos from "./videos.data.json";

const V = videos as Record<string, string>;

/** Playable transcode URL for a piece, or undefined if it isn't a video. */
export function getVideoSrc(slug: string): string | undefined {
  return V[slug];
}

/** Whether a piece has a playable video reel. */
export function isVideo(slug: string): boolean {
  return slug in V;
}
