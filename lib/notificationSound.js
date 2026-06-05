"use client";

// lib/notificationSound.js
//
// Shared notification chime for BOTH the investor and admin dashboards, so the
// two can never drift apart. A short two-tone WebAudio chime — no asset file,
// no network — plays whenever a new notification drops in.
//
// Browser autoplay policy: audio can only START after the user has interacted
// with the page at least once. We therefore "warm up" (create/resume) the
// AudioContext on every user gesture. Critically the gesture listeners are NOT
// one-shot: browsers suspend the context after periods of inactivity, and a
// re-warm on the next gesture is what keeps the chime working for the whole
// session instead of going silent after the first suspension.

import { useEffect } from "react";

// Module-scoped so the context survives component re-renders and is shared by
// both bells if they ever mount together.
let _audioCtx = null;

/**
 * Create or resume the shared AudioContext. Safe to call repeatedly; must be
 * invoked from within a user-gesture handler for the browser to allow audio.
 */
export function warmUpAudio() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!_audioCtx || _audioCtx.state === "closed") {
      _audioCtx = new AudioCtx();
    }
    if (_audioCtx.state === "suspended") {
      _audioCtx.resume();
    }
  } catch {}
}

/**
 * Play the two-tone notification chime. If the context exists but was suspended
 * (e.g. the tab was idle), we attempt a resume first — harmless if the browser
 * declines it. Stays silent only when no gesture has ever warmed the context,
 * which the autoplay policy makes unavoidable.
 */
export function playNotificationSound() {
  try {
    if (!_audioCtx || _audioCtx.state === "closed") return;
    if (_audioCtx.state === "suspended") {
      // Best-effort; may be granted if a gesture has occurred this session.
      _audioCtx.resume();
    }
    if (_audioCtx.state !== "running") return;

    const tones = [
      { freq: 880,     start: 0,    peak: 0.02, end: 0.45, vol: 0.22 },
      { freq: 1174.66, start: 0.18, peak: 0.20, end: 0.62, vol: 0.18 },
    ];

    tones.forEach(({ freq, start, peak, end, vol }) => {
      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, _audioCtx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, _audioCtx.currentTime + peak);
      gain.gain.exponentialRampToValueAtTime(0.0001, _audioCtx.currentTime + end);
      osc.start(_audioCtx.currentTime + start);
      osc.stop(_audioCtx.currentTime + end);
    });
  } catch {}
}

/**
 * Hook: attaches gesture listeners that keep the AudioContext warm for the
 * lifetime of the component. Listeners are passive and re-fire on every
 * gesture (NOT { once: true }) so the chime survives context suspension.
 */
export function useAudioWarmup() {
  useEffect(() => {
    const events = ["click", "keydown", "touchstart", "pointerdown"];
    const handler = () => warmUpAudio();
    events.forEach((e) => document.addEventListener(e, handler, { passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, handler));
  }, []);
}
