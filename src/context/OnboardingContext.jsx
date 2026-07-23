import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HelpCenter from "../components/onboarding/HelpCenter";
import OnboardingTour from "../components/onboarding/OnboardingTour";
import {
  clearTourProgress,
  readTourProgress,
  writeTourProgress,
} from "../onboarding/tourStorage";
import { getTutorials, resolveTutorial } from "../onboarding/tourRegistry";
import { useAuth } from "./authStore";
import { OnboardingContext } from "./onboardingStore";
import FloatingBusinessChat from "../components/chat/FloatingBusinessChat";

export function OnboardingProvider({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTour, setActiveTour] = useState(null);
  const [current, setCurrent] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [progress, setProgress] = useState({});
  const tutorials = useMemo(
    () => (user ? getTutorials(user.role) : []),
    [user],
  );
  const routeTour = useMemo(
    () => (user ? resolveTutorial(user.role, location.pathname) : null),
    [location.pathname, user],
  );

  useEffect(() => {
    if (user) queueMicrotask(() => setProgress(readTourProgress(user)));
  }, [user]);
  useEffect(() => {
    if (isLoading || !isAuthenticated || !routeTour || activeTour || helpOpen)
      return undefined;
    const state = readTourProgress(user)[routeTour.id];
    if (state?.status === "completed" || state?.status === "skipped")
      return undefined;
    const timer = window.setTimeout(() => {
      setCurrent(state?.lastStep || 0);
      setActiveTour(routeTour);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activeTour, helpOpen, isAuthenticated, isLoading, routeTour, user]);

  const saveState = useCallback(
    (tour, state) =>
      setProgress((existing) =>
        writeTourProgress(user, {
          ...existing,
          [tour.id]: { ...existing[tour.id], ...state },
        }),
      ),
    [user],
  );
  const startTour = useCallback(
    (tour = routeTour) => {
      if (!tour) return;
      setHelpOpen(false);
      setCurrent(0);
      setActiveTour(tour);
      if (tour.path && location.pathname !== tour.path) navigate(tour.path);
    },
    [location.pathname, navigate, routeTour],
  );
  const closeWith = useCallback(
    (status) => {
      if (activeTour) saveState(activeTour, { status, lastStep: current });
      setActiveTour(null);
      setCurrent(0);
    },
    [activeTour, current, saveState],
  );
  const next = useCallback(() => {
    if (!activeTour) return;
    const value = Math.min(current + 1, activeTour.steps.length - 1);
    saveState(activeTour, { status: "started", lastStep: value });
    setCurrent(value);
  }, [activeTour, current, saveState]);
  const back = useCallback(() => {
    const value = Math.max(0, current - 1);
    if (activeTour)
      saveState(activeTour, { status: "started", lastStep: value });
    setCurrent(value);
  }, [activeTour, current, saveState]);
  const resetAll = useCallback(() => {
    clearTourProgress(user);
    setProgress({});
    setHelpOpen(false);
    if (routeTour) startTour(routeTour);
  }, [routeTour, startTour, user]);
  const value = useMemo(
    () => ({
      openHelpCenter: () => setHelpOpen(true),
      restartOnboarding: resetAll,
      startCurrentTour: () => startTour(routeTour),
    }),
    [resetAll, routeTour, startTour],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {isAuthenticated ? (
        <>
          <FloatingBusinessChat />
          <button
            aria-label="Abrir centro de ayuda"
            className="fixed bottom-4 right-4 z-[120] flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white shadow-lg shadow-primary/30 transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setHelpOpen(true)}
            title="Centro de ayuda"
            type="button"
          >
            ?
          </button>
        </>
      ) : null}
      <HelpCenter
        onClose={() => setHelpOpen(false)}
        onReset={resetAll}
        onStart={startTour}
        open={helpOpen}
        progress={progress}
        tutorials={tutorials}
      />
      {activeTour ? (
        <OnboardingTour
          current={current}
          onBack={back}
          onFinish={() => closeWith("completed")}
          onNext={next}
          onSkip={() => closeWith("skipped")}
          step={activeTour.steps[current]}
          total={activeTour.steps.length}
        />
      ) : null}
    </OnboardingContext.Provider>
  );
}
