"use client";

import { useEffect } from "react";

/* Registers /sw.js once the page settles. Production only — registering in
   dev would serve stale bundles from cache and waste debugging hours.
   Reloads exactly once when an UPDATE takes control (first install has no
   prior controller, so no reload storm on fresh visits). */

export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let disposed = false;
    let reloaded = false;
    const hadController = Boolean(navigator.serviceWorker.controller);

    const onControllerChange = () => {
      if (disposed || reloaded || !hadController) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener?.("controllerchange", onControllerChange);

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline on first visit — the next load will retry */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      disposed = true;
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener?.("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
