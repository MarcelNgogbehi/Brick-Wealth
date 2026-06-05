"use client";

// lib/useInactivityTimeout.js
//
// Redirects the user to the login portal after 3 hours of inactivity.
// "Inactivity" means no clicks, keystrokes, scrolls, or touch events.
// Also fires on visibilitychange (tab re-focus / system wake from sleep).

import { useEffect, useRef } from "react";

const INACTIVITY_LIMIT_MS = 3 * 60 * 60 * 1000; // 3 hours
const STORAGE_KEY = "bw_last_active";
const WRITE_THROTTLE_MS = 60_000; // update localStorage at most once per minute

function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/**
 * @param {object} opts
 * @param {string} opts.logoutUrl  - POST endpoint that clears the session cookie
 * @param {string} [opts.redirectUrl="/portal"] - Where to send the user after logout
 */
export function useInactivityTimeout({ logoutUrl, redirectUrl = "/portal" }) {
  const lastWriteRef = useRef(0);

  useEffect(() => {
    // Stamp "I was just active" into localStorage (throttled)
    function stampActivity() {
      const now = Date.now();
      if (now - lastWriteRef.current > WRITE_THROTTLE_MS) {
        try {
          localStorage.setItem(STORAGE_KEY, String(now));
        } catch {}
        lastWriteRef.current = now;
      }
    }

    async function checkInactivity() {
      let stored;
      try {
        stored = localStorage.getItem(STORAGE_KEY);
      } catch {}

      if (!stored) {
        // First visit — set baseline and continue
        stampActivity();
        return;
      }

      const elapsed = Date.now() - parseInt(stored, 10);
      if (elapsed > INACTIVITY_LIMIT_MS) {
        // Expired — wipe the marker, call logout, hard-redirect
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        try {
          await fetch(logoutUrl, {
            method: "POST",
            credentials: "same-origin",
            headers: { "X-CSRF-Token": getCsrfToken() },
          });
        } catch {}
        window.location.href = redirectUrl;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") checkInactivity();
    }

    // Check immediately on mount (handles page reload after long absence)
    checkInactivity();

    // Keep the timestamp fresh while the user is active
    const ACTIVITY_EVENTS = ["click", "keydown", "scroll", "touchstart", "mousemove"];
    ACTIVITY_EVENTS.forEach((evt) =>
      document.addEventListener(evt, stampActivity, { passive: true })
    );

    // Re-check whenever the tab/window becomes visible again
    // (covers: alt-tab back, laptop lid open, phone unlock)
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        document.removeEventListener(evt, stampActivity)
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [logoutUrl, redirectUrl]);
}
