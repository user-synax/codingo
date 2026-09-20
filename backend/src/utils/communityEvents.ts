import { EventEmitter } from "node:events";

/**
 * In-process live feed bus for community events.
 * MVP runs as a single backend instance, so an in-memory emitter is
 * enough for SSE fan-out. If the backend ever scales horizontally,
 * replace this with a shared pub/sub (e.g. Redis) — the call sites
 * in routes/community.ts stay the same.
 */

export type CommunityEvent =
  | { type: "thread"; thread: Record<string, unknown> }
  | { type: "reply"; reply: Record<string, unknown> };

type Listener = (event: CommunityEvent) => void;

const bus = new EventEmitter();
// No per-listener leak warnings — each SSE connection adds one listener
bus.setMaxListeners(0);

export function emitCommunityEvent(event: CommunityEvent) {
  bus.emit("community", event);
}

export function subscribeCommunityEvents(listener: Listener): () => void {
  bus.on("community", listener);
  return () => {
    bus.off("community", listener);
  };
}
