"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

/**
 * Tracks whether the user has made a gesture that unlocked media playback for the session.
 *
 * iOS/Safari (and Chrome) grant autoplay after the first successful user-initiated play.
 * Per the research doc (§Q2) we "reuse the first successful gesture to unlock the session":
 * once any transition plays (via autoplay OR a tap-to-play tap), `unlocked` flips true and
 * any clip still showing the tap overlay retries automatically.
 */
type PlaybackUnlock = { unlocked: boolean; markUnlocked: () => void };

const PlaybackUnlockContext = createContext<PlaybackUnlock>({
  unlocked: false,
  markUnlocked: () => {},
});

export function PlaybackUnlockProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const markUnlocked = useCallback(() => setUnlocked(true), []);
  return (
    <PlaybackUnlockContext.Provider value={{ unlocked, markUnlocked }}>
      {children}
    </PlaybackUnlockContext.Provider>
  );
}

export function usePlaybackUnlock() {
  return useContext(PlaybackUnlockContext);
}
