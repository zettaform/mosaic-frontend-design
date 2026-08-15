import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const GuidedTourContext = createContext(null);

const defaultGuidedTourValue = {
  activeTourId: null,
  currentStepIndex: 0,
  phase: 'idle',
  countdownValue: 3,
  startTourWithCountdown: () => {},
  stopTour: () => {},
  nextStep: () => {},
  getCurrentStep: () => null,
};

export const useGuidedTour = () => {
  const ctx = useContext(GuidedTourContext);
  // In case a component is accidentally rendered outside the provider,
  // fall back to a safe no-op implementation instead of throwing.
  return ctx || defaultGuidedTourValue;
};

const TOUR_STEP_CONFIG = {
  'chapter-1': [
    {
      id: 'intro',
      type: 'message',
      selector: null,
      title: 'Welcome to Hashtag Tasks',
      message:
        'This page helps you target public users in your niche by collecting posts for a specific hashtag from Instagram.',
    },
    {
      id: 'hashtag-input',
      type: 'spotlight',
      selector: '#tour-hashtag-input',
      title: 'Enter your niche hashtag',
      message:
        'Start by entering a hashtag that represents your niche. For example, type in #summerfashion, #realestate, or any keyword your audience uses.',
    },
    {
      id: 'target-count',
      type: 'spotlight',
      selector: '#tour-target-count-input',
      title: 'Set a limit for how many users to collect',
      message:
        'Choose how many records you want to collect in this run. This controls how many public users will be added to your database from this hashtag.',
    },
    {
      id: 'start-task',
      type: 'spotlight',
      selector: '#tour-start-task-button',
      title: 'Start the task',
      message:
        'Click here to start the task. Cinderella will keep an eye on the progress and you can see live statistics as users are collected.',
    },
  ],
  // Placeholder step sets for chapters 2-6 so the tours can run with simple messages
  'chapter-2': [
    {
      id: 'intro',
      type: 'message',
      selector: null,
      title: 'User statistics overview',
      message:
        'This tour walks you through the statistics dashboard where you can see totals, unique users, and email availability.',
    },
  ],
  'chapter-3': [
    {
      id: 'intro',
      type: 'message',
      selector: null,
      title: 'Shortlisting users for campaigns',
      message:
        'This tour will show you how to filter and shortlist users from your collected database for a specific campaign.',
    },
  ],
  'chapter-4': [
    {
      id: 'intro',
      type: 'message',
      selector: null,
      title: 'AI assistants that write emails on demand',
      message:
        'This tour introduces the AI email assistant so you can generate outbound or follow-up emails directly from your data.',
    },
  ],
  'chapter-5': [
    {
      id: 'intro',
      type: 'message',
      selector: null,
      title: 'Instructing the AI to fit your business',
      message:
        'Here you will learn how to tune prompts and instructions so the AI assistant matches your brand voice and workflows.',
    },
  ],
  'chapter-6': [
    {
      id: 'intro',
      type: 'message',
      selector: null,
      title: 'Email replies & autonomous agents',
      message:
        'This tour explains how reply automation works and how agents can handle conversations on your behalf.',
    },
  ],
};

export const GuidedTourProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTourId, setActiveTourId] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | countdown | running
  const [countdownValue, setCountdownValue] = useState(3);
  const [targetRoute, setTargetRoute] = useState(null);
  const [morphVisible, setMorphVisible] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const audioRef = useRef(null);

  // Start a tour with a visible 3–2–1 countdown
  const startTourWithCountdown = ({ tourId, targetRoute: route }) => {
    setActiveTourId(tourId);
    setCurrentStepIndex(0);
    setTargetRoute(route);
    setCountdownValue(3);
    setPhase('countdown');
    setMorphVisible(false);
  };

  const stopTour = () => {
    setActiveTourId(null);
    setCurrentStepIndex(0);
    setPhase('idle');
    setCountdownValue(3);
    setTargetRoute(null);
  };

  const nextStep = () => {
    if (!activeTourId) return;
    const steps = TOUR_STEP_CONFIG[activeTourId] || [];
    if (currentStepIndex + 1 < steps.length) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      stopTour();
    }
  };

  // Handle countdown progression
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdownValue <= 1) {
      const isChapterOne = activeTourId === 'chapter-1';

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('guided-tour-sidebar-open', {
            detail: { route: targetRoute },
          })
        );
        window.dispatchEvent(
          new CustomEvent('guided-tour-highlight', {
            detail: { route: isChapterOne ? '/admin/tasks' : targetRoute },
          })
        );
      }

      if (isChapterOne) {
        // Chapter 1: 1s sidebar open + 2s sidebar scroll, then animate click on Tasks
        const clickDelay = 1000 + 2000;
        const clickTimer = setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('guided-tour-task-click', {
                detail: { route: '/admin/tasks' },
              })
            );
          }
          setPhase('running');
        }, clickDelay);

        return () => clearTimeout(clickTimer);
      }

      // Other chapters: quick morph + navigate
      setMorphVisible(true);

      const transitionTimer = setTimeout(() => {
        if (targetRoute && location.pathname !== targetRoute) {
          navigate(targetRoute);
        }
        setPhase('running');
        setMorphVisible(false);
      }, 500);

      return () => clearTimeout(transitionTimer);
    }

    const timer = setTimeout(() => {
      setCountdownValue((v) => v - 1);
    }, 900);

    return () => clearTimeout(timer);
  }, [phase, countdownValue, targetRoute, navigate, location.pathname, activeTourId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!audioRef.current) {
      // Keep this pointing at a file that exists in `public/` for local dev.
      // (Previously referenced /audio/cinderella-theme.mp3 which 404'd.)
      audioRef.current = new Audio('/background-music.mp3');
      audioRef.current.loop = true;
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.4;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (musicEnabled) {
      audio
        .play()
        .catch(() => {
          // ignore autoplay restrictions
        });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      audio.pause();
    };
  }, [musicEnabled]);

  const value = {
    activeTourId,
    currentStepIndex,
    phase,
    countdownValue,
    morphVisible,
    musicEnabled,
    startTourWithCountdown,
    stopTour,
    nextStep,
    toggleMusic: () => setMusicEnabled((prev) => !prev),
    getCurrentStep: () => {
      if (!activeTourId) return null;
      const steps = TOUR_STEP_CONFIG[activeTourId] || [];
      return steps[currentStepIndex] || null;
    },
  };

  return (
    <GuidedTourContext.Provider value={value}>
      {children}
      <GuidedTourCountdownOverlay />
      <GuidedTourTransitionOverlay />
      <GuidedTourHighlightOverlay />
      <GuidedTourCinderellaOverlay />
      <GuidedTourMusicToggle />
    </GuidedTourContext.Provider>
  );
};

const GuidedTourCountdownOverlay = () => {
  const { phase, countdownValue, activeTourId } = useGuidedTour();
  const [sparkles] = useState(() =>
    Array.from({ length: 14 }).map((_, idx) => ({
      id: idx,
      delay: Math.random() * 0.5,
      left: `${Math.random() * 100}%`,
    }))
  );

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  return (
    <AnimatePresence>
      {phase === 'countdown' && activeTourId && (
        <motion.div
          key="guided-tour-countdown"
          initial={{ opacity: 0, scale: 0.7, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.2, y: -20 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="pointer-events-none fixed inset-0 z-[120] flex items-start justify-center pt-10"
        >
          <div className="guided-tour-glass-panel">
            <div className="flex items-center justify-center space-x-4">
              <span className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">Tour begins in</span>
              <motion.span
                key={countdownValue}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-4xl font-bold text-white drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]"
              >
                {countdownValue}
              </motion.span>
            </div>

            <div className="countdown-bloom" />
            {sparkles.map((sparkle) => (
              <span
                key={sparkle.id + countdownValue}
                className="countdown-particle"
                style={{
                  animationDelay: `${sparkle.delay}s`,
                  left: sparkle.left,
                }}
              ></span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const GuidedTourTransitionOverlay = () => {
  const { morphVisible } = useGuidedTour();

  if (typeof window === 'undefined') return null;

  return (
    <AnimatePresence>
      {morphVisible && (
        <motion.div
          key="guided-tour-transition"
          className="pointer-events-none fixed inset-0 z-[115]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.35), rgba(15,23,42,0.95) 65%)',
          }}
        >
          <motion.div
            initial={{ scaleX: 0.6, scaleY: 1.4, opacity: 0 }}
            animate={{ scaleX: 1.2, scaleY: 1, opacity: 1 }}
            exit={{ scaleX: 1.4, scaleY: 0.6, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-10 rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-3xl"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const GuidedTourHighlightOverlay = () => {
  const { phase, getCurrentStep } = useGuidedTour();
  const step = getCurrentStep();
  const [spotlightRect, setSpotlightRect] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (phase !== 'running' || !step || step.type !== 'spotlight' || !step.selector) {
      setSpotlightRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(step.selector);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSpotlightRect({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    const observer = new MutationObserver(updateRect);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', updateRect);
      observer.disconnect();
    };
  }, [phase, step]);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!spotlightRect) return;
    const handlePointer = (event) => {
      const xRatio = (event.clientX - spotlightRect.x) / window.innerWidth;
      const yRatio = (event.clientY - spotlightRect.y) / window.innerHeight;
      setTilt({
        x: (yRatio - 0.5) * 8,
        y: (xRatio - 0.5) * -8,
      });
    };
    window.addEventListener('pointermove', handlePointer);
    return () => window.removeEventListener('pointermove', handlePointer);
  }, [spotlightRect]);

  if (!spotlightRect) return null;

  const radius = Math.max(spotlightRect.width, spotlightRect.height) * 0.8 + 40;

  const maskStyle = {
    WebkitMaskImage: `radial-gradient(circle ${radius}px at ${spotlightRect.x}px ${spotlightRect.y}px, transparent 0%, transparent 55%, rgba(0,0,0,0.9) 56%)`,
    maskImage: `radial-gradient(circle ${radius}px at ${spotlightRect.x}px ${spotlightRect.y}px, transparent 0%, transparent 55%, rgba(0,0,0,0.9) 56%)`,
  };

  return (
    <AnimatePresence>
      <motion.div
        key="guided-spotlight-overlay"
        className="pointer-events-none fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm"
        style={maskStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        key="guided-spotlight-ring"
        className="pointer-events-none fixed z-[111] rounded-full border border-cyan-300/60 shadow-[0_0_30px_rgba(59,130,246,0.45)]"
        style={{
          width: radius * 1.2,
          height: radius * 1.2,
          left: spotlightRect.x - (radius * 1.2) / 2,
          top: spotlightRect.y - (radius * 1.2) / 2,
        }}
        animate={{ rotateX: tilt.x, rotateY: tilt.y, opacity: 1 }}
        initial={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <div className="guided-tour-pulse-ring" />
      </motion.div>
    </AnimatePresence>
  );
};

const GuidedTourCinderellaOverlay = () => {
  const { phase, activeTourId, getCurrentStep, nextStep, stopTour } = useGuidedTour();
  const viewport = useMemo(() => {
    if (typeof window === 'undefined') {
      return { width: 1200, height: 800 };
    }
    return { width: window.innerWidth, height: window.innerHeight };
  }, []);
  const [position, setPosition] = useState({
    x: viewport.width - 240,
    y: viewport.height - 220,
  });
  const [typedText, setTypedText] = useState('');
  const [showCaret, setShowCaret] = useState(true);
  const isBrowser = typeof window !== 'undefined';
  const isActive = isBrowser && phase === 'running' && !!activeTourId;
  const step = isActive ? getCurrentStep() : null;
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, visible: false });

  // Cursor targeting with friction via motion
  useEffect(() => {
    if (!isBrowser || !step || step.type !== 'spotlight' || !step.selector) {
      setCursorPos((prev) => ({ ...prev, visible: false }));
      return;
    }
    const el = document.querySelector(step.selector);
    if (!el) {
      setCursorPos((prev) => ({ ...prev, visible: false }));
      return;
    }
    const rect = el.getBoundingClientRect();
    setCursorPos({
      x: rect.left + rect.width - 12,
      y: rect.top + rect.height / 2,
      visible: true,
    });
  }, [step, isBrowser]);

  // Typewriter effect
  useEffect(() => {
    if (!step || !step.message) {
      setTypedText('');
      return;
    }
    setTypedText('');
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTypedText(step.message.slice(0, index));
      if (index >= step.message.length) {
        clearInterval(interval);
      }
    }, 35 + Math.random() * 30);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    const caretInterval = setInterval(() => {
      setShowCaret((prev) => !prev);
    }, 500);
    return () => clearInterval(caretInterval);
  }, []);

  // Draggable with inertia
  const onDrag = (_, info) => {
    setPosition((prev) => ({
      x: Math.min(Math.max(prev.x + info.delta.x, 16), viewport.width - 260),
      y: Math.min(Math.max(prev.y + info.delta.y, 80), viewport.height - 140),
    }));
  };

  if (!isActive || !step) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="guided-tour-cursor"
          className="pointer-events-none fixed z-[115]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: cursorPos.visible ? 1 : 0,
            x: cursorPos.x,
            y: cursorPos.y,
            scale: cursorPos.visible ? 1 : 0.4,
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        >
          <div className="guided-cursor">
            <span className="guided-cursor-core" />
            <span className="guided-cursor-shadow" />
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="fixed z-[120] cursor-grab active:cursor-grabbing"
        style={{ x: position.x, y: position.y }}
        drag
        dragElastic={0.4}
        dragMomentum
        dragConstraints={{
          top: 60,
          left: 16,
          right: viewport.width - 220,
          bottom: viewport.height - 120,
        }}
        onDrag={onDrag}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 18 }}
      >
        <div className="relative">
          <div className="cinderella-particles" />
          <div className="flex items-end space-x-3">
            <div className="cinderella-bubble">
              <div className="text-[10px] uppercase tracking-[0.3em] text-amber-400/80">Cinderella</div>
              {step.title && <div className="text-sm font-semibold text-slate-900 dark:text-white">{step.title}</div>}
              <p className="text-xs text-slate-700 dark:text-slate-200 h-20 overflow-hidden">
                {typedText}
                <span className={`caret ${showCaret ? 'opacity-100' : 'opacity-0'}`}>|</span>
              </p>
              <div className="mt-3 flex items-center justify-between space-x-2">
                <button
                  type="button"
                  onClick={stopTour}
                  className="rounded-full border border-slate-200/60 px-3 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                >
                  End tour
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1 text-[11px] font-semibold text-white shadow-lg shadow-indigo-500/30"
                >
                  Next step
                </button>
              </div>
            </div>
            <div className="cinderella-avatar">
              <div className="avatar-core" />
              <div className="avatar-shadow" />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const GuidedTourMusicToggle = () => {
  // Temporarily disabled per requirements
  return null;
};


