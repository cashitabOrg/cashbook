"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("Service Worker registered.", reg.scope))
          .catch((err) => console.error("Service Worker registration failed.", err));
      } else {
        // In development, unregister any existing service workers and clear caches
        // to prevent stale webpack/turbopack chunks from being loaded.
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log("Service Worker unregistered in development mode.");
              }
            });
          }
        });

        if (window.caches) {
          caches.keys().then((names) => {
            for (const name of names) {
              caches.delete(name);
            }
          });
        }
      }
    }
  }, []);

  return null;
}
