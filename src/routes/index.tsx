import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { App } from "@/screens/App";
import { IDENTITY } from "@/data/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "अंक साथी · Ank Saathi — minus numbers tutor" },
      { name: "description", content: "Offline-first adaptive Hindi/English tutor for Class 7 integers: number line, comparing, adding and subtracting negative numbers." },
      { property: "og:title", content: "अंक साथी · Ank Saathi" },
      { property: "og:description", content: "Adaptive tutor for Class 7 integers that works on slow internet and offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  // The tutor reads localStorage and the URL hash, so it renders only after the page loads.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-2xl font-extrabold">अंक साथी</p>
        <p className="text-muted-foreground">चलो देखते हैं…</p>
        <p className="mt-8 font-mono text-xs text-muted-foreground">{IDENTITY}</p>
      </div>
    );
  }
  return <App />;
}
