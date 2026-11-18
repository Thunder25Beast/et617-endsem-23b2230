// Tiny hash router (#/practice, #/about ...). The server only ever serves "/",
// so refreshing any screen never gives a 404, online or offline.
import { useSyncExternalStore } from "react";

export const ROUTES = ["who", "check", "learn", "practice", "feedback", "progress", "about"] as const;
export type Route = (typeof ROUTES)[number];

export function parseHash(hash: string): Route {
  const name = hash.replace(/^#\/?/, "").split("?")[0] as Route;
  return (ROUTES as readonly string[]).includes(name) ? name : "who";
}

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export function useHashRoute(): Route {
  return useSyncExternalStore(
    subscribe,
    () => parseHash(window.location.hash),
    () => "who" as Route,
  );
}

export function go(route: Route) {
  if (parseHash(window.location.hash) === route && window.location.hash) return;
  window.location.hash = `#/${route}`;
  window.scrollTo({ top: 0 });
}
