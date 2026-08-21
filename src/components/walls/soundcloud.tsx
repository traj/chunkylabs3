"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { WallItem } from "@/data/catalog";

/**
 * The BR-transport engine: ONE hidden SoundCloud iframe driven by the SC Widget API.
 *
 * ⚠️ ENVIRONMENT NOTE — the live-position surface here (PLAY_PROGRESS → `positionMs`, elapsed
 * readout, scrubber fill) was built to the documented SC Widget API but could NOT be live-verified
 * in the automation Chrome (it accepts play/pause but never advances real audio — see the build
 * report + memory sc-widget-audio-browser2). Every other surface (load/bind/play/pause/duration/
 * gesture-gating) is verified. Eye-verify the scrubber in a real browser.
 *
 * AUTOPLAY: the widget is warmed EAGERLY on wall entry (primed paused on the default-tab head), so
 * the actual play call — `widget.load(url, {auto_play:true})` — runs SYNCHRONOUSLY inside the row/
 * PLAY click handler, under the document's sticky activation. No async play() detached from the
 * gesture. iframe carries `allow="autoplay"`.
 *
 * PERSISTENCE: this provider lives inside a single wall's overlay, so playback naturally survives
 * every browse/detail state change WITHIN the wall. `stop()` is called when the wall goes inactive
 * (StationFrame de-activation), and the iframe is destroyed when the wall leaves the mount window —
 * either way, audio stops on leaving the wall, never crosses to another.
 */

// --- SC Widget API typings (minimal — only what we call) --------------------------------------
interface SCWidget {
  bind(event: string, listener: (data?: unknown) => void): void;
  play(): void;
  pause(): void;
  load(url: string, options?: Record<string, unknown>): void;
  getPosition(cb: (ms: number) => void): void;
  getDuration(cb: (ms: number) => void): void;
}
interface SCWidgetStatic {
  (iframe: HTMLIFrameElement): SCWidget;
  Events: {
    READY: string;
    PLAY: string;
    PAUSE: string;
    FINISH: string;
    PLAY_PROGRESS: string;
    ERROR: string;
  };
}
declare global {
  interface Window {
    SC?: { Widget: SCWidgetStatic };
  }
}

const API_SRC = "https://w.soundcloud.com/player/api.js";
let apiPromise: Promise<SCWidgetStatic> | null = null;

/** Load the SC Widget API script once; resolve with SC.Widget. */
function loadWidgetApi(): Promise<SCWidgetStatic> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.SC?.Widget) return Promise.resolve(window.SC.Widget);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<SCWidgetStatic>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${API_SRC}"]`);
    const onload = () => {
      if (window.SC?.Widget) resolve(window.SC.Widget);
      else reject(new Error("SC.Widget missing after load"));
    };
    if (existing) {
      existing.addEventListener("load", onload);
      existing.addEventListener("error", () => reject(new Error("SC api.js failed")));
      if (window.SC?.Widget) resolve(window.SC.Widget);
      return;
    }
    const s = document.createElement("script");
    s.src = API_SRC;
    s.async = true;
    s.addEventListener("load", onload);
    s.addEventListener("error", () => reject(new Error("SC api.js failed")));
    document.head.appendChild(s);
  });
  return apiPromise;
}

/** Hidden-player iframe URL for a track permalink. */
function widgetSrc(scUrl: string): string {
  const params = new URLSearchParams({
    url: scUrl,
    auto_play: "false",
    visual: "false",
    show_teaser: "false",
    hide_related: "true",
    show_comments: "false",
    show_reposts: "false",
    buying: "false",
    download: "false",
    sharing: "false",
    show_user: "true",
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

export interface SoundCloudState {
  /** Currently loaded item (the last one PLAY was pressed on), or null before any play. */
  current: WallItem | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  /** Play (loads if a different track) / resume if same track. Call inside a user gesture. */
  playItem: (item: WallItem) => void;
  pause: () => void;
  toggle: () => void;
  /** Stop and forget (used on wall de-activation). */
  stop: () => void;
}

const SoundCloudContext = createContext<SoundCloudState | null>(null);

export function useSoundCloud(): SoundCloudState {
  const ctx = useContext(SoundCloudContext);
  if (!ctx) throw new Error("useSoundCloud must be used within <SoundCloudProvider>");
  return ctx;
}

export function SoundCloudProvider({
  primeUrl,
  children,
}: {
  /** A valid SC track permalink used to warm the widget (played never; paused primer). */
  primeUrl?: string;
  children: ReactNode;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<SCWidget | null>(null);
  const readyRef = useRef(false);
  // The item we intend to be playing; drives `current`. A pending item is one whose load() we
  // fired before READY/last-load completed — applied once the widget can accept it.
  const [current, setCurrent] = useState<WallItem | null>(null);
  const currentRef = useRef<WallItem | null>(null);
  const pendingRef = useRef<WallItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const setCurrentBoth = useCallback((item: WallItem | null) => {
    currentRef.current = item;
    setCurrent(item);
  }, []);

  // Warm the widget once on mount: create SC.Widget on the primer iframe and bind events.
  useEffect(() => {
    let cancelled = false;
    const iframe = iframeRef.current;
    if (!iframe) return;
    loadWidgetApi()
      .then((Widget) => {
        if (cancelled || !iframeRef.current) return;
        const w = Widget(iframeRef.current);
        widgetRef.current = w;
        const E = Widget.Events;
        w.bind(E.READY, () => {
          readyRef.current = true;
          // If the user already pressed play before the widget was ready, honour it now.
          const pending = pendingRef.current;
          if (pending) {
            pendingRef.current = null;
            w.load(pending.scUrl!, {
              auto_play: true,
              show_teaser: false,
              visual: false,
              callback: () => w.getDuration((d) => setDurationMs(d)),
            });
          }
        });
        w.bind(E.PLAY, () => setIsPlaying(true));
        w.bind(E.PAUSE, () => setIsPlaying(false));
        w.bind(E.FINISH, () => {
          // Track ended → the persistent player dissolves (current cleared).
          setIsPlaying(false);
          setPositionMs(0);
          setDurationMs(0);
          setCurrentBoth(null);
        });
        w.bind(E.PLAY_PROGRESS, (d) => {
          const p = (d as { currentPosition?: number } | undefined)?.currentPosition;
          if (typeof p === "number") setPositionMs(p);
        });
      })
      .catch(() => {
        /* offline / blocked — transport stays inert; UI shows the paused primer state */
      });
    return () => {
      cancelled = true;
      try {
        widgetRef.current?.pause();
      } catch {
        /* iframe may already be gone */
      }
      widgetRef.current = null;
      readyRef.current = false;
    };
  }, []);

  const playItem = useCallback(
    (item: WallItem) => {
      if (!item.scUrl) return; // only SC items are transport-playable
      const w = widgetRef.current;
      // Same track already loaded → just resume.
      if (currentRef.current?.id === item.id && readyRef.current && w) {
        w.play();
        setIsPlaying(true);
        return;
      }
      setCurrentBoth(item);
      setPositionMs(0);
      setDurationMs(0);
      if (!w || !readyRef.current) {
        // widget not ready yet — remember it; the READY handler will load+play it.
        pendingRef.current = item;
        return;
      }
      w.load(item.scUrl, {
        auto_play: true,
        show_teaser: false,
        visual: false,
        callback: () => w.getDuration((d) => setDurationMs(d)),
      });
    },
    [setCurrentBoth],
  );

  const pause = useCallback(() => {
    widgetRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else if (currentRef.current) playItem(currentRef.current);
  }, [isPlaying, pause, playItem]);

  const stop = useCallback(() => {
    try {
      widgetRef.current?.pause();
    } catch {
      /* ignore */
    }
    pendingRef.current = null;
    setIsPlaying(false);
    setPositionMs(0);
    setDurationMs(0);
    setCurrentBoth(null);
  }, [setCurrentBoth]);

  const value = useMemo<SoundCloudState>(
    () => ({ current, isPlaying, positionMs, durationMs, playItem, pause, toggle, stop }),
    [current, isPlaying, positionMs, durationMs, playItem, pause, toggle, stop],
  );

  return (
    <SoundCloudContext.Provider value={value}>
      {/* Hidden player — 1px, offscreen, non-interactive, but decode-live while the wall is up. */}
      <iframe
        ref={iframeRef}
        title="chunkylabs audio player"
        aria-hidden
        tabIndex={-1}
        allow="autoplay"
        src={primeUrl ? widgetSrc(primeUrl) : "about:blank"}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          border: 0,
          left: -9999,
          top: 0,
        }}
      />
      {children}
    </SoundCloudContext.Provider>
  );
}
