// The whole tutor: picks the screen from the URL hash. Runs only in the browser
// (it needs localStorage), so the server sends a light shell.
import { useEffect } from "react";
import { useActiveLearner, useSettings } from "@/engine/storage";
import { go, useHashRoute } from "@/lib/hash-route";
import { registerServiceWorker } from "@/lib/register-sw";
import { Shell } from "@/components/Shell";
import { WhoScreen } from "./WhoScreen";
import { QuickCheckScreen } from "./QuickCheckScreen";
import { LearnScreen } from "./LearnScreen";
import { PracticeScreen } from "./PracticeScreen";
import { FeedbackScreen } from "./FeedbackScreen";
import { ProgressScreen } from "./ProgressScreen";
import { AboutScreen } from "./AboutScreen";

export function App() {
  const route = useHashRoute();
  const learner = useActiveLearner();
  const { lang } = useSettings();

  useEffect(() => registerServiceWorker(), []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const needsLearner = route !== "who" && route !== "about";
  useEffect(() => {
    if (needsLearner && !learner) go("who");
  }, [needsLearner, learner]);

  const screen =
    needsLearner && !learner ? null : route === "who" ? (
      <WhoScreen />
    ) : route === "check" ? (
      <QuickCheckScreen />
    ) : route === "learn" ? (
      <LearnScreen />
    ) : route === "practice" ? (
      <PracticeScreen />
    ) : route === "feedback" ? (
      <FeedbackScreen />
    ) : route === "progress" ? (
      <ProgressScreen />
    ) : (
      <AboutScreen />
    );

  return <Shell route={route}>{screen}</Shell>;
}
