"use client";

// lib/useInactivityTimeout.js
//
// Redirects the user to the login portal after 4 hours of inactivity.
// Applies to BOTH the investor dashboard and the admin console — each shell
// calls this hook with its own logout endpoint, but the limit and behaviour
// are shared here so they can never drift apart.
//
// "Inactivity" means no clicks, keystrokes, scrolls, or touch events.
// Expiry is checked on mount, on visibilitychange (tab re-focus / system wake),
// AND on a periodic poll — so an idle-but-visible tab still times out instead
// of waiting for the user to come back and (accidentally) refresh the marker.

import { useEffect, useRef } from "react";

const INACTIVITY_LIMIT_MS = 4 * 60 * 60 * 1000; // 4 hours
const POLL_INTERVAL_MS = 60_000; // re-check expiry once a minute, even while idle
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
  const expiredRef = useRef(false); // ensures we only log out once

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
      if (expiredRef.current) return; // logout already in flight

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
        // Expired — wipe the marker, call logout, hard-redirect.
        // Latch first so a concurrent poll/visibility check can't double-fire.
        expiredRef.current = true;
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

    // Poll on a timer so a session that simply sits idle (tab open and visible,
    // user away from the keyboard) still expires at the 4-hour mark.
    const pollId = setInterval(checkInactivity, POLL_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        document.removeEventListener(evt, stampActivity)
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(pollId);
    };
  }, [logoutUrl, redirectUrl]);
}
