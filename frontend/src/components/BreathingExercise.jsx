import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { userService } from "../services/api";
import "../styles/BreathingExercise.scss";

const MIN_SECONDS = 1;
const MAX_SECONDS = 60;
const MIN_CYCLES = 1;
const MAX_CYCLES = 50;

const PHASE_WIND = {
  inhale: { freqStart: 280, freqEnd: 750, q: 1.1 },
  hold:   { freqStart: 450, freqEnd: 450, q: 0.7 },
  exhale: { freqStart: 750, freqEnd: 220, q: 1.4 },
};

const COLOR_PALETTES = [
  {
    id: "ocean",
    label: "Ocean",
    core: ["#9ecfdf", "#3d8fa8", "#1a5570"],
    orb: [
      "rgba(255, 255, 255, 0.96)",
      "rgba(71, 166, 226, 0.9)",
      "rgba(22, 88, 148, 0.96)",
    ],
    shadow: {
      core: "rgba(61, 143, 168, 0.45)",
      coreSoft: "rgba(61, 143, 168, 0.38)",
      coreStrong: "rgba(61, 143, 168, 0.62)",
      orb: "rgba(24, 100, 166, 0.34)",
      coreDark: "rgba(158, 207, 223, 0.5)",
      orbDark: "rgba(64, 157, 236, 0.45)",
    },
  },
  {
    id: "sunrise",
    label: "Sunrise",
    core: ["#ffd9a3", "#f59e0b", "#b45309"],
    orb: [
      "rgba(255, 250, 239, 0.97)",
      "rgba(251, 146, 60, 0.9)",
      "rgba(194, 65, 12, 0.96)",
    ],
    shadow: {
      core: "rgba(245, 158, 11, 0.45)",
      coreSoft: "rgba(245, 158, 11, 0.38)",
      coreStrong: "rgba(245, 158, 11, 0.62)",
      orb: "rgba(194, 65, 12, 0.34)",
      coreDark: "rgba(251, 146, 60, 0.52)",
      orbDark: "rgba(234, 88, 12, 0.45)",
    },
  },
  {
    id: "forest",
    label: "Forest",
    core: ["#c3f7d7", "#22c55e", "#166534"],
    orb: [
      "rgba(245, 255, 249, 0.97)",
      "rgba(34, 197, 94, 0.88)",
      "rgba(21, 128, 61, 0.96)",
    ],
    shadow: {
      core: "rgba(34, 197, 94, 0.45)",
      coreSoft: "rgba(34, 197, 94, 0.38)",
      coreStrong: "rgba(34, 197, 94, 0.62)",
      orb: "rgba(21, 128, 61, 0.34)",
      coreDark: "rgba(34, 197, 94, 0.52)",
      orbDark: "rgba(21, 128, 61, 0.45)",
    },
  },
  {
    id: "lavender",
    label: "Lavender",
    core: ["#e8d5ff", "#a78bfa", "#6d28d9"],
    orb: [
      "rgba(249, 243, 255, 0.97)",
      "rgba(167, 139, 250, 0.9)",
      "rgba(109, 40, 217, 0.96)",
    ],
    shadow: {
      core: "rgba(167, 139, 250, 0.45)",
      coreSoft: "rgba(167, 139, 250, 0.38)",
      coreStrong: "rgba(167, 139, 250, 0.62)",
      orb: "rgba(109, 40, 217, 0.34)",
      coreDark: "rgba(196, 181, 253, 0.52)",
      orbDark: "rgba(124, 58, 237, 0.45)",
    },
  },
  {
    id: "ember",
    label: "Ember",
    core: ["#ffe5ce", "#ef4444", "#991b1b"],
    orb: [
      "rgba(255, 246, 239, 0.97)",
      "rgba(248, 113, 113, 0.9)",
      "rgba(153, 27, 27, 0.96)",
    ],
    shadow: {
      core: "rgba(239, 68, 68, 0.45)",
      coreSoft: "rgba(239, 68, 68, 0.38)",
      coreStrong: "rgba(239, 68, 68, 0.62)",
      orb: "rgba(153, 27, 27, 0.34)",
      coreDark: "rgba(248, 113, 113, 0.52)",
      orbDark: "rgba(185, 28, 28, 0.45)",
    },
  },
];

const PHASES = [
  {
    key: "inhale",
    label: "Breathe In",
    hint: "Inhale slowly through your nose.",
  },
  { key: "hold", label: "Hold", hint: "Hold comfortably without strain." },
  {
    key: "exhale",
    label: "Breathe Out",
    hint: "Exhale slowly through your mouth.",
  },
];

const PRESET_PROFILES = [
  {
    id: "preset-calm-reset",
    name: "Calm Reset",
    inhale_seconds: 4,
    hold_seconds: 4,
    exhale_seconds: 6,
    audio_enabled: true,
    audio_level: 0.09,
    color_palette: "ocean",
    visual_shape: "orb",
  },
  {
    id: "preset-focus-box",
    name: "Focus Box",
    inhale_seconds: 4,
    hold_seconds: 4,
    exhale_seconds: 4,
    audio_enabled: true,
    audio_level: 0.08,
    color_palette: "forest",
    visual_shape: "crystal",
  },
  {
    id: "preset-deep-sleep",
    name: "Deep Sleep 4-7-8",
    inhale_seconds: 4,
    hold_seconds: 7,
    exhale_seconds: 8,
    audio_enabled: true,
    audio_level: 0.06,
    color_palette: "lavender",
    visual_shape: "ripple",
  },
];

const clampSeconds = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return MIN_SECONDS;
  }

  return Math.max(MIN_SECONDS, Math.min(MAX_SECONDS, Math.round(numeric)));
};

const clampCycleCount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 5;
  }

  return Math.max(MIN_CYCLES, Math.min(MAX_CYCLES, Math.round(numeric)));
};

const normalizeAudioLevel = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0.12;
  }

  const clamped = Math.max(0, Math.min(0.3, numeric));
  return Number(clamped.toFixed(2));
};

const normalizeColorPalette = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  const hasPalette = COLOR_PALETTES.some(
    (palette) => palette.id === normalized,
  );
  return hasPalette ? normalized : "ocean";
};

const VISUAL_SHAPES = [
  { id: "orb",     label: "Orb" },
  { id: "lotus",   label: "Lotus" },
  { id: "crystal", label: "Crystal" },
  { id: "ripple",  label: "Ripple" },
];

const normalizeVisualShape = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return VISUAL_SHAPES.some((s) => s.id === normalized) ? normalized : "orb";
};

const getProfileIcon = () => null;

const BreathingExercise = ({ userId, settings, onSettingsChange }) => {
  const [durations, setDurations] = useState({
    inhale: clampSeconds(settings?.inhale ?? 4),
    hold: clampSeconds(settings?.hold ?? 4),
    exhale: clampSeconds(settings?.exhale ?? 6),
  });
  const [cycleCount, setCycleCount] = useState(
    clampCycleCount(settings?.cycleCount ?? 5),
  );
  const [breathingProgress, setBreathingProgress] = useState({
    phaseIndex: 0,
    secondsRemaining: clampSeconds(settings?.inhale ?? 4),
  });
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [activeTab, setActiveTab] = useState("exercise");
  const [audioEnabled, setAudioEnabled] = useState(
    typeof settings?.audioEnabled === "boolean" ? settings.audioEnabled : true,
  );
  const [audioLevel, setAudioLevel] = useState(
    normalizeAudioLevel(settings?.audioLevel ?? 0.12),
  );
  const [colorPalette, setColorPalette] = useState(
    normalizeColorPalette(settings?.colorPalette),
  );
  const [visualShape, setVisualShape] = useState(
    normalizeVisualShape(settings?.visualShape),
  );
  const [saveState, setSaveState] = useState("idle");
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileSaveState, setProfileSaveState] = useState("idle");
  const [profileError, setProfileError] = useState("");
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [deletingProfileId, setDeletingProfileId] = useState(null);
  const audioContextRef = useRef(null);
  const activeCueRef = useRef(null);
  const durationsRef = useRef(durations);
  const runDurationsRef = useRef(durations);
  const previousPhaseIndexRef = useRef(0);
  const latestSettingsRef = useRef(null);
  const saveStateTimeoutRef = useRef(null);
  const profileSaveTimeoutRef = useRef(null);
  const shouldStopAtCycleBoundaryRef = useRef(false);

  const phaseIndex = breathingProgress.phaseIndex;
  const secondsRemaining = breathingProgress.secondsRemaining;

  useEffect(() => {
    durationsRef.current = durations;
    if (!isRunning) {
      runDurationsRef.current = durations;
    }
  }, [durations, isRunning]);

  useEffect(() => {
    const syncedDurations = {
      inhale: clampSeconds(settings?.inhale ?? 4),
      hold: clampSeconds(settings?.hold ?? 4),
      exhale: clampSeconds(settings?.exhale ?? 6),
    };

    setDurations(syncedDurations);
    setCycleCount(clampCycleCount(settings?.cycleCount ?? 5));
    setAudioEnabled(
      typeof settings?.audioEnabled === "boolean"
        ? settings.audioEnabled
        : true,
    );
    setAudioLevel(normalizeAudioLevel(settings?.audioLevel ?? 0.12));
    setColorPalette(normalizeColorPalette(settings?.colorPalette));
    setVisualShape(normalizeVisualShape(settings?.visualShape));

    durationsRef.current = syncedDurations;
    runDurationsRef.current = syncedDurations;
  setBreathingProgress({ phaseIndex: 0, secondsRemaining: syncedDurations.inhale });
    setCompletedCycles(0);
    shouldStopAtCycleBoundaryRef.current = false;
    setIsRunning(false);
  // Only re-sync when the user changes (login/logout/switch).
  // Individual settings deps are intentionally omitted: after the component
  // mounts and initialises from the server, local state is the source of
  // truth. Re-syncing on every save response creates a race where an
  // in-flight save with stale values overwrites changes the user just made.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProfiles([]);
      return undefined;
    }

    let isActive = true;
    setProfilesLoading(true);
    setProfileError("");

    userService
      .getBreathingProfiles(userId)
      .then((response) => {
        if (isActive) {
          setProfiles(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch(() => {
        if (isActive) {
          setProfileError("Could not load saved profiles");
        }
      })
      .finally(() => {
        if (isActive) {
          setProfilesLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [userId]);

  const activePhase = PHASES[phaseIndex];

  const selectedExerciseName = useMemo(() => {
    const allProfiles = [...profiles, ...PRESET_PROFILES];
    const activeProfile = allProfiles.find(
      (profile) => String(profile.id) === String(activeProfileId),
    );

    return activeProfile?.name || "Custom Exercise";
  }, [activeProfileId, profiles]);

  const editingProfile = useMemo(
    () =>
      profiles.find(
        (profile) => String(profile.id) === String(editingProfileId),
      ) || null,
    [editingProfileId, profiles],
  );

  const totalCycleSeconds = useMemo(() => {
    return durations.inhale + durations.hold + durations.exhale;
  }, [durations]);

  const ensureAudioContext = useCallback(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  const stopActiveCue = useCallback((fadeOutSeconds = 0.06) => {
    const context = audioContextRef.current;
    const activeCue = activeCueRef.current;

    if (!context || !activeCue) {
      activeCueRef.current = null;
      return;
    }

    const now = context.currentTime;
    const gain = activeCue.gain;

    if (gain) {
      if (typeof gain.gain.cancelAndHoldAtTime === "function") {
        gain.gain.cancelAndHoldAtTime(now);
      } else {
        gain.gain.cancelScheduledValues(now);
        const safeLevel = Math.max(gain.gain.value, 0.0001);
        gain.gain.setValueAtTime(safeLevel, now);
      }
      gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeOutSeconds);
    }

    activeCue.oscillators.forEach((oscillator) => {
      if (!oscillator) {
        return;
      }

      try {
        oscillator.stop(now + fadeOutSeconds + 0.01);
      } catch (error) {
        // Ignore stop errors for already-stopped oscillators.
      }
    });

    activeCueRef.current = null;
  }, []);

  const playPhaseCue = useCallback(
    (phaseKey) => {
      if (!audioEnabled) {
        return;
      }

      const phaseConfig = PHASE_WIND[phaseKey];
      const context = ensureAudioContext();
      if (!context || !phaseConfig) {
        return;
      }

      const now = context.currentTime;
      const currentDurations = runDurationsRef.current;
      const phaseDurationSeconds = Math.max(
        0.35,
        Number(currentDurations[phaseKey]) || 1,
      );
      const fadeInTime = Math.min(1.2, phaseDurationSeconds * 0.45);
      const endTime = now + phaseDurationSeconds;
      const fadeOutStart =
        phaseKey === "exhale"
          ? now + phaseDurationSeconds * 0.42
          : now + phaseDurationSeconds * 0.5;
      // Fade completely to silence at least 300ms before the phase ends
      const fadeOutEnd = Math.max(fadeOutStart + 0.4, endTime - 0.3);

      stopActiveCue(0.03);

      // White noise buffer shared by both sources
      const bufferSize = Math.ceil(context.sampleRate * (phaseDurationSeconds + 0.1));
      const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const channelData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.random() * 2 - 1;
      }

      // Primary source: bandpass sweep — the body of the wind
      const sourceMain = context.createBufferSource();
      sourceMain.buffer = noiseBuffer;
      const bandpass = context.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(phaseConfig.freqStart, now);
      bandpass.frequency.linearRampToValueAtTime(phaseConfig.freqEnd, endTime);
      bandpass.Q.setValueAtTime(phaseConfig.q, now);

      // Secondary source: highpass — airy overtone layer
      const sourceAiry = context.createBufferSource();
      sourceAiry.buffer = noiseBuffer;
      const highpass = context.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(2200, now);
      highpass.Q.setValueAtTime(0.5, now);
      const airyGain = context.createGain();
      airyGain.gain.setValueAtTime(0.22, now);

      // Master gain envelope — fades fully to silence before phase end
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(audioLevel, now + fadeInTime);
      gain.gain.setValueAtTime(audioLevel, fadeOutStart);
      gain.gain.linearRampToValueAtTime(0.0001, fadeOutEnd);

      sourceMain.connect(bandpass);
      bandpass.connect(gain);
      sourceAiry.connect(highpass);
      highpass.connect(airyGain);
      airyGain.connect(gain);
      gain.connect(context.destination);

      sourceMain.start(now);
      sourceAiry.start(now);
      sourceMain.stop(endTime);
      sourceAiry.stop(endTime);

      activeCueRef.current = {
        gain,
        oscillators: [sourceMain, sourceAiry],
      };

      sourceMain.onended = () => {
        if (activeCueRef.current?.oscillators?.includes(sourceMain)) {
          activeCueRef.current = null;
        }
      };
    },
    [audioEnabled, audioLevel, ensureAudioContext, stopActiveCue],
  );

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setBreathingProgress((current) => {
        const currentDurations = runDurationsRef.current;
        if (current.secondsRemaining > 1) {
          return {
            ...current,
            secondsRemaining: current.secondsRemaining - 1,
          };
        }

        const nextPhaseIndex = (current.phaseIndex + 1) % PHASES.length;

        let nextSeconds;
        if (nextPhaseIndex === 0) {
          setCompletedCycles((cycles) => {
            const nextCompletedCycles = cycles + 1;
            if (nextCompletedCycles >= cycleCount) {
              shouldStopAtCycleBoundaryRef.current = true;
            }
            return nextCompletedCycles;
          });
          nextSeconds = currentDurations.inhale;
        } else {
          nextSeconds = currentDurations[PHASES[nextPhaseIndex].key];
        }

        return {
          phaseIndex: nextPhaseIndex,
          secondsRemaining: nextSeconds,
        };
      });
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [cycleCount, isRunning, secondsRemaining]);

  useEffect(() => {
    if (
      !isRunning ||
      !shouldStopAtCycleBoundaryRef.current ||
      completedCycles < cycleCount
    ) {
      return;
    }

    shouldStopAtCycleBoundaryRef.current = false;
    stopActiveCue(0.03);
    setIsRunning(false);
    setBreathingProgress({
      phaseIndex: 0,
      secondsRemaining: durationsRef.current.inhale,
    });
  }, [completedCycles, cycleCount, durations.inhale, isRunning, stopActiveCue]);

  useEffect(() => {
    if (!isRunning || !audioEnabled) {
      previousPhaseIndexRef.current = phaseIndex;
      return;
    }

    if (previousPhaseIndexRef.current !== phaseIndex) {
      if (!shouldStopAtCycleBoundaryRef.current) {
        playPhaseCue(PHASES[phaseIndex].key);
      }
    }

    previousPhaseIndexRef.current = phaseIndex;
  }, [audioEnabled, isRunning, phaseIndex, playPhaseCue]);

  useEffect(() => {
    return () => {
      if (saveStateTimeoutRef.current) {
        window.clearTimeout(saveStateTimeoutRef.current);
        saveStateTimeoutRef.current = null;
      }
      if (profileSaveTimeoutRef.current) {
        window.clearTimeout(profileSaveTimeoutRef.current);
        profileSaveTimeoutRef.current = null;
      }
      stopActiveCue(0.03);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stopActiveCue]);

  useEffect(() => {
    if (!audioEnabled) {
      stopActiveCue(0.03);
    }
  }, [audioEnabled, stopActiveCue]);

  useEffect(() => {
    if (!onSettingsChange) {
      return undefined;
    }

    const nextSettings = {
      inhale: clampSeconds(durations.inhale),
      hold: clampSeconds(durations.hold),
      exhale: clampSeconds(durations.exhale),
      cycleCount: clampCycleCount(cycleCount),
      audioEnabled,
      audioLevel: normalizeAudioLevel(audioLevel),
      colorPalette: normalizeColorPalette(colorPalette),
      visualShape: normalizeVisualShape(visualShape),
    };

    const serialized = JSON.stringify(nextSettings);
    if (latestSettingsRef.current === null) {
      latestSettingsRef.current = serialized;
      return undefined;
    }

    if (latestSettingsRef.current === serialized) {
      return undefined;
    }

    const saveTimer = window.setTimeout(() => {
      setSaveState("saving");

      Promise.resolve(onSettingsChange(nextSettings))
        .then((didSave) => {
          if (didSave === false) {
            setSaveState("error");
            return;
          }

          latestSettingsRef.current = serialized;
          setSaveState("saved");
          if (saveStateTimeoutRef.current) {
            window.clearTimeout(saveStateTimeoutRef.current);
          }
          saveStateTimeoutRef.current = window.setTimeout(() => {
            setSaveState("idle");
          }, 1800);
        })
        .catch(() => {
          setSaveState("error");
        });
    }, 450);

    return () => {
      window.clearTimeout(saveTimer);
    };
  }, [
    audioEnabled,
    audioLevel,
    cycleCount,
    colorPalette,
    visualShape,
    durations.exhale,
    durations.hold,
    durations.inhale,
    onSettingsChange,
  ]);

  const updateDuration = (key, value) => {
    const nextValue = clampSeconds(value);
    setActiveProfileId(editingProfileId);
    setDurations((current) => {
      const nextDurations = {
        ...current,
        [key]: nextValue,
      };

      durationsRef.current = nextDurations;
      if (!isRunning) {
        runDurationsRef.current = nextDurations;
      }

      if (!isRunning && PHASES[phaseIndex].key === key) {
        setBreathingProgress((current) => ({
          ...current,
          secondsRemaining: nextValue,
        }));
      }

      return nextDurations;
    });
  };

  const adjustDuration = (key, delta) => {
    updateDuration(key, durations[key] + delta);
  };

  const updateCycleCount = (value) => {
    const nextValue = clampCycleCount(value);
    setActiveProfileId(editingProfileId);
    setCycleCount(nextValue);
    setCompletedCycles((current) => Math.min(current, nextValue));

    if (isRunning && completedCycles >= nextValue) {
      shouldStopAtCycleBoundaryRef.current = false;
      stopActiveCue(0.03);
      setIsRunning(false);
      setBreathingProgress({ phaseIndex: 0, secondsRemaining: durations.inhale });
    }
  };

  const adjustCycleCount = (delta) => {
    updateCycleCount(cycleCount + delta);
  };

  const handleAudioEnabledChange = (event) => {
    setActiveProfileId(editingProfileId);
    setAudioEnabled(event.target.checked);
  };

  const handleAudioLevelChange = (event) => {
    setActiveProfileId(editingProfileId);
    setAudioLevel(normalizeAudioLevel(event.target.value));
  };

  const handlePaletteChange = (paletteId) => {
    setActiveProfileId(editingProfileId);
    setColorPalette(normalizeColorPalette(paletteId));
  };

  const handleShapeChange = (shapeId) => {
    setVisualShape(normalizeVisualShape(shapeId));
  };

  const clearProfileEditor = useCallback(() => {
    setEditingProfileId(null);
    setActiveProfileId(null);
    setProfileName("");
    setProfileError("");
    setProfileSaveState("idle");
  }, []);

  const handleSaveProfile = async () => {
    const trimmedName = profileName.trim();
    const isEditingProfile = Boolean(editingProfileId);

    if (!userId) {
      setProfileSaveState("error");
      setProfileError("Sign in again to save a profile");
      return;
    }

    if (!trimmedName) {
      setProfileSaveState("error");
      setProfileError("Enter a profile name");
      return;
    }

    setProfileSaveState("saving");
    setProfileError("");

    try {
      const payload = {
        name: trimmedName,
        inhaleSeconds: durations.inhale,
        holdSeconds: durations.hold,
        exhaleSeconds: durations.exhale,
        audioEnabled,
        audioLevel: normalizeAudioLevel(audioLevel),
      };

      const response = editingProfileId
        ? await userService.updateBreathingProfile(
            userId,
            editingProfileId,
            payload,
          )
        : await userService.createBreathingProfile(userId, payload);

      const nextProfile = response.data;
      setProfiles((current) => {
        if (isEditingProfile) {
          return current.map((profile) =>
            profile.id === nextProfile.id ? nextProfile : profile,
          );
        }

        return [nextProfile, ...current];
      });
      setActiveProfileId(nextProfile.id);
      setEditingProfileId(null);
      setProfileName("");
      setProfileSaveState(isEditingProfile ? "updated" : "saved");
      if (profileSaveTimeoutRef.current) {
        window.clearTimeout(profileSaveTimeoutRef.current);
      }
      profileSaveTimeoutRef.current = window.setTimeout(() => {
        setProfileSaveState("idle");
      }, 1800);
    } catch (error) {
      setProfileSaveState("error");
      setProfileError(error.response?.data?.error || "Could not save profile");
    }
  };

  const handleApplyProfile = (profile) => {
    const nextDurations = {
      inhale: clampSeconds(profile.inhale_seconds),
      hold: clampSeconds(profile.hold_seconds),
      exhale: clampSeconds(profile.exhale_seconds),
    };

    setDurations(nextDurations);
    durationsRef.current = nextDurations;
    runDurationsRef.current = nextDurations;
    setAudioEnabled(Boolean(profile.audio_enabled));
    setAudioLevel(normalizeAudioLevel(profile.audio_level));
    if (profile.color_palette) {
      setColorPalette(normalizeColorPalette(profile.color_palette));
    }
    if (profile.visual_shape) {
      setVisualShape(normalizeVisualShape(profile.visual_shape));
    }
    setActiveProfileId(String(profile.id));
    setBreathingProgress({ phaseIndex: 0, secondsRemaining: nextDurations.inhale });
    setCompletedCycles(0);
    setActiveTab("exercise");
    stopActiveCue(0.03);
    setIsRunning(false);
  };

  const handleEditProfile = (profile) => {
    setActiveTab("settings");
    setEditingProfileId(profile.id);
    setProfileName(profile.name);
    setProfileError("");
    setProfileSaveState("idle");
    setActiveProfileId(profile.id);
    const nextDurations = {
      inhale: clampSeconds(profile.inhale_seconds),
      hold: clampSeconds(profile.hold_seconds),
      exhale: clampSeconds(profile.exhale_seconds),
    };
    setDurations(nextDurations);
    durationsRef.current = nextDurations;
    if (!isRunning) {
      runDurationsRef.current = nextDurations;
    }
    setAudioEnabled(Boolean(profile.audio_enabled));
    setAudioLevel(normalizeAudioLevel(profile.audio_level));
    setBreathingProgress({
      phaseIndex: 0,
      secondsRemaining: clampSeconds(profile.inhale_seconds),
    });
    setCompletedCycles(0);
    stopActiveCue(0.03);
    setIsRunning(false);
  };

  const handleDeleteProfile = async (profile) => {
    if (!userId) {
      setProfileSaveState("error");
      setProfileError("Sign in again to delete a profile");
      return;
    }

    setDeletingProfileId(profile.id);
    setProfileSaveState("saving");
    setProfileError("");

    try {
      await userService.deleteBreathingProfile(userId, profile.id);

      setProfiles((current) =>
        current.filter((currentProfile) => currentProfile.id !== profile.id),
      );

      if (String(activeProfileId) === String(profile.id)) {
        setActiveProfileId(null);
      }

      if (String(editingProfileId) === String(profile.id)) {
        clearProfileEditor();
      }

      setProfileSaveState("deleted");
      if (profileSaveTimeoutRef.current) {
        window.clearTimeout(profileSaveTimeoutRef.current);
      }
      profileSaveTimeoutRef.current = window.setTimeout(() => {
        setProfileSaveState("idle");
      }, 1800);
    } catch (error) {
      setProfileSaveState("error");
      setProfileError(error.response?.data?.error || "Could not delete profile");
    } finally {
      setDeletingProfileId(null);
    }
  };

  const handleStart = () => {
    const shouldRestartCycleSet = completedCycles >= cycleCount;
    const runDurations = { ...durationsRef.current };
    const startPhaseIndex = shouldRestartCycleSet ? 0 : phaseIndex;

    runDurationsRef.current = runDurations;

    shouldStopAtCycleBoundaryRef.current = false;
    if (shouldRestartCycleSet) {
      setCompletedCycles(0);
      setBreathingProgress({ phaseIndex: 0, secondsRemaining: runDurations.inhale });
    }

    if (audioEnabled) {
      playPhaseCue(PHASES[startPhaseIndex].key);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    shouldStopAtCycleBoundaryRef.current = false;
    stopActiveCue(0.03);
    setIsRunning(false);
  };

  const handleReset = () => {
    runDurationsRef.current = durationsRef.current;
    shouldStopAtCycleBoundaryRef.current = false;
    stopActiveCue(0.03);
    setIsRunning(false);
    setCompletedCycles(0);
    setBreathingProgress({
      phaseIndex: 0,
      secondsRemaining: durationsRef.current.inhale,
    });
  };

  const selectedPalette =
    COLOR_PALETTES.find((palette) => palette.id === colorPalette) ||
    COLOR_PALETTES[0];

  return (
    <section className="breathing-page">
      <div className="breathing-header">
        <h2>Breathing Exercise</h2>
        <p>Set your pace, then follow the guided in, hold, and out cycle.</p>
      </div>

      <div
        className="breathing-tabs"
        role="tablist"
        aria-label="Breathing page tabs"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "exercise"}
          className={`breathing-tab-btn ${activeTab === "exercise" ? "active" : ""}`}
          onClick={() => {
            clearProfileEditor();
            setActiveTab("exercise");
          }}
        >
          Exercise
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "settings"}
          className={`breathing-tab-btn ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      <div className="breathing-layout">
        {activeTab === "settings" && (
          <article className="breathing-settings-card">
            <section className="settings-section-card settings-section-profiles">
              <div className="settings-saved-profiles">
                <div className="saved-profiles-header">
                  <h3>Preset Profiles</h3>
                  <p>Quick start with three built-in breathing patterns.</p>
                </div>

                <div className="saved-profiles-list settings-profile-list">
                  {PRESET_PROFILES.map((profile) => (
                    <article
                      key={profile.id}
                      className={`saved-profile-card preset-profile-card ${activeProfileId === String(profile.id) ? "active" : ""}`}
                    >
                      <div className="saved-profile-head">
                        <span className="saved-profile-name">{profile.name}</span>
                        <span className="saved-profile-icon" aria-hidden="true">
                          {getProfileIcon(profile)}
                        </span>
                      </div>
                      <span className="saved-profile-meta">
                        {profile.inhale_seconds}-{profile.hold_seconds}-
                        {profile.exhale_seconds} sec
                      </span>
                      <span className="saved-profile-meta">
                        Audio{" "}
                        {profile.audio_enabled
                          ? `on • ${normalizeAudioLevel(profile.audio_level)}`
                          : "off"}
                      </span>
                      <div className="saved-profile-actions">
                        <button
                          type="button"
                          className="control-btn secondary"
                          onClick={() => handleApplyProfile(profile)}
                        >
                          Use Preset
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="saved-profiles-header profiles-section-divider">
                  <h3>Saved Profiles</h3>
                  <p>Edit a saved profile or load it into the form above.</p>
                </div>

                {profilesLoading && (
                  <p className="saved-profiles-empty">Loading profiles...</p>
                )}
                {!profilesLoading && profileError && !profiles.length && (
                  <p className="saved-profiles-empty">{profileError}</p>
                )}
                {!profilesLoading && !profiles.length && !profileError && (
                  <p className="saved-profiles-empty">No saved profiles yet.</p>
                )}

                {!!profiles.length && (
                  <div className="saved-profiles-list settings-profile-list">
                    {profiles.map((profile) => (
                      <article
                        key={profile.id}
                        className={`saved-profile-card ${activeProfileId === profile.id ? "active" : ""} ${String(editingProfileId) === String(profile.id) ? "is-editing" : ""}`}
                      >
                        <div className="saved-profile-head">
                          <div className="saved-profile-title-group">
                            <span className="saved-profile-name">
                              {profile.name}
                            </span>
                            {String(editingProfileId) === String(profile.id) && (
                              <span className="saved-profile-editing-badge">
                                Editing
                              </span>
                            )}
                          </div>
                          <span className="saved-profile-icon" aria-hidden="true">
                            {getProfileIcon(profile)}
                          </span>
                        </div>
                        <span className="saved-profile-meta">
                          {profile.inhale_seconds}-{profile.hold_seconds}-
                          {profile.exhale_seconds} sec
                        </span>
                        <span className="saved-profile-meta">
                          Audio{" "}
                          {profile.audio_enabled
                            ? `on • ${normalizeAudioLevel(profile.audio_level)}`
                            : "off"}
                        </span>
                        <div className="saved-profile-actions">
                          <button
                            type="button"
                            className="control-btn secondary"
                            onClick={() => handleApplyProfile(profile)}
                            disabled={deletingProfileId === profile.id}
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            className="control-btn ghost"
                            onClick={() => handleEditProfile(profile)}
                            disabled={deletingProfileId === profile.id}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="control-btn danger"
                            onClick={() => handleDeleteProfile(profile)}
                            disabled={deletingProfileId === profile.id}
                          >
                            {deletingProfileId === profile.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="settings-section-card settings-section-timing">
              <h3>Timing Settings</h3>
              <p className="breathing-settings-help">
                Choose seconds for each phase.
              </p>

              {PHASES.map((phase) => (
                <div key={phase.key} className="breathing-setting-row">
                  <div className="breathing-setting-text">
                    <label htmlFor={`breathing-${phase.key}`}>
                      {phase.label}
                    </label>
                    <span>{phase.hint}</span>
                  </div>
                  <div
                    className="breathing-stepper"
                    role="group"
                    aria-label={`${phase.label} timing`}
                  >
                    <button
                      type="button"
                      className="step-btn"
                      onClick={() => adjustDuration(phase.key, -1)}
                    >
                      -
                    </button>
                    <input
                      id={`breathing-${phase.key}`}
                      type="number"
                      min={MIN_SECONDS}
                      max={MAX_SECONDS}
                      value={durations[phase.key]}
                      onChange={(event) =>
                        updateDuration(phase.key, event.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="step-btn"
                      onClick={() => adjustDuration(phase.key, 1)}
                    >
                      +
                    </button>
                    <span className="step-unit">sec</span>
                  </div>
                </div>
              ))}

              <div className="breathing-setting-row">
                <div className="breathing-setting-text">
                  <label htmlFor="breathing-cycle-count">Cycles</label>
                  <span>
                    Stop automatically after this many full breathing cycles.
                  </span>
                </div>
                <div
                  className="breathing-stepper"
                  role="group"
                  aria-label="Breathing cycle count"
                >
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => adjustCycleCount(-1)}
                  >
                    -
                  </button>
                  <input
                    id="breathing-cycle-count"
                    type="number"
                    min={MIN_CYCLES}
                    max={MAX_CYCLES}
                    value={cycleCount}
                    onChange={(event) => updateCycleCount(event.target.value)}
                  />
                  <button
                    type="button"
                    className="step-btn"
                    onClick={() => adjustCycleCount(1)}
                  >
                    +
                  </button>
                  <span className="step-unit">cycles</span>
                </div>
              </div>

              <div className="breathing-total">
                <strong>Total cycle:</strong> {totalCycleSeconds} sec
              </div>

              <div
                className={`breathing-save-status ${saveState !== "idle" ? `state-${saveState}` : ""}`}
                aria-live="polite"
              >
                {saveState === "saving" && "Saving settings..."}
                {saveState === "saved" && "Settings saved"}
                {saveState === "error" && "Could not save settings"}
              </div>
            </section>

            <section className="settings-section-card settings-section-audio">
              <div className="audio-settings-block">
              <h4>Audio Cues</h4>
              <div className="audio-toggle-row">
                <span>
                  Play calming tones for inhale, hold, and exhale
                  <span className={`audio-toggle-status ${audioEnabled ? "is-on" : "is-off"}`}>
                    {audioEnabled ? "On" : "Off"}
                  </span>
                </span>
                <label htmlFor="breathing-audio-enabled" className="audio-toggle-label">
                  <input
                    id="breathing-audio-enabled"
                    type="checkbox"
                    checked={audioEnabled}
                    onChange={handleAudioEnabledChange}
                  />
                </label>
              </div>

              <label
                className="audio-volume-row"
                htmlFor="breathing-audio-volume"
              >
                <span>Volume</span>
                <input
                  id="breathing-audio-volume"
                  type="range"
                  min="0"
                  max="0.3"
                  step="0.01"
                  value={audioLevel}
                  onChange={handleAudioLevelChange}
                  disabled={!audioEnabled}
                />
              </label>
            </div>

            </section>

            <section className="settings-section-card settings-section-colors">
              <div className="color-settings-block">
              <h4>Breathing Shape</h4>
              <p className="breathing-settings-help">
                Choose a visual style for the breathing exercise.
              </p>
              <div
                className="shape-grid"
                role="group"
                aria-label="Breathing visual shape"
              >
                {VISUAL_SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    type="button"
                    className={`shape-chip ${visualShape === shape.id ? "active" : ""}`}
                    onClick={() => handleShapeChange(shape.id)}
                    aria-pressed={visualShape === shape.id}
                  >
                    <span className={`shape-preview shape-preview-${shape.id}`} aria-hidden="true">
                      {shape.id === "lotus" && (
                        <svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
                          {[0, 60, 120, 180, 240, 300].map((angle) => (
                            <g key={angle} transform={`rotate(${angle}, 14, 14)`}>
                              <ellipse cx="14" cy="7" rx="3.5" ry="7" fill="currentColor" opacity="0.72" />
                            </g>
                          ))}
                          <circle cx="14" cy="14" r="4.5" fill="currentColor" opacity="0.95" />
                        </svg>
                      )}
                    </span>
                    <span>{shape.label}</span>
                  </button>
                ))}
              </div>
              <h4 className="color-subhead">Color Palette</h4>
              <p className="breathing-settings-help">
                Customize the shape colors.
              </p>
              <div
                className="palette-grid"
                role="group"
                aria-label="Breathing shape color palette"
              >
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    type="button"
                    className={`palette-chip ${colorPalette === palette.id ? "active" : ""}`}
                    onClick={() => handlePaletteChange(palette.id)}
                    aria-pressed={colorPalette === palette.id}
                    title={palette.label}
                  >
                    <span
                      className="palette-swatch"
                      style={{
                        "--swatch-a": palette.core[0],
                        "--swatch-b": palette.core[1],
                        "--swatch-c": palette.core[2],
                      }}
                    />
                    <span>{palette.label}</span>
                  </button>
                ))}
              </div>
              </div>
            </section>

            <section className="settings-section-card settings-section-save-profile">
              <div className="profile-settings-block">
                <h4>
                  {editingProfileId ? "Edit Profile" : "Save Current Profile"}
                </h4>
                {editingProfile && (
                  <div className="editing-profile-callout" aria-live="polite">
                    <span className="editing-profile-label">Currently editing</span>
                    <strong className="editing-profile-name">
                      {editingProfile.name}
                    </strong>
                  </div>
                )}
                <p className="breathing-settings-help">
                  {editingProfileId
                    ? "Update the selected profile with the values shown above."
                    : "Create named presets here. They will appear on the Exercise tab."}
                </p>
                <div className="profile-save-row">
                  <input
                    type="text"
                    value={profileName}
                    maxLength={80}
                    placeholder="Example: Deep Sleep Wind-Down"
                    onChange={(event) => setProfileName(event.target.value)}
                  />
                <div className="profile-save-actions">
                  <button
                    type="button"
                    className="control-btn primary"
                    onClick={handleSaveProfile}
                    disabled={profileSaveState === "saving"}
                  >
                    {profileSaveState === "saving"
                      ? "Saving..."
                      : editingProfileId
                        ? "Update Profile"
                        : "Save Profile"}
                  </button>
                  {editingProfileId && (
                    <button
                      type="button"
                      className="control-btn ghost"
                      onClick={clearProfileEditor}
                    >
                      Cancel
                    </button>
                  )}
                </div>
                </div>
                <div
                  className={`breathing-save-status ${profileSaveState !== "idle" ? `state-${profileSaveState}` : ""}`}
                  aria-live="polite"
                >
                  {profileSaveState === "saved" && "Profile saved"}
                  {profileSaveState === "updated" && "Profile updated"}
                  {profileSaveState === "deleted" && "Profile deleted"}
                  {profileSaveState === "error" &&
                    (profileError || "Could not save profile")}
                </div>
              </div>
            </section>
          </article>
        )}

        {activeTab === "exercise" && (
          <article
            className={`breathing-player-card shape-${visualShape} phase-state-${activePhase.key} ${isRunning ? "is-running" : "is-paused"}`}
            style={{
              "--phase-ms": `${durations[activePhase.key] * 1000}ms`,
              "--core-1": selectedPalette.core[0],
              "--core-2": selectedPalette.core[1],
              "--core-3": selectedPalette.core[2],
              "--orb-1": selectedPalette.orb[0],
              "--orb-2": selectedPalette.orb[1],
              "--orb-3": selectedPalette.orb[2],
              "--core-shadow": selectedPalette.shadow.core,
              "--core-shadow-soft": selectedPalette.shadow.coreSoft,
              "--core-shadow-strong": selectedPalette.shadow.coreStrong,
              "--orb-shadow": selectedPalette.shadow.orb,
              "--core-shadow-dark": selectedPalette.shadow.coreDark,
              "--orb-shadow-dark": selectedPalette.shadow.orbDark,
            }}
          >
            <div className="selected-exercise-summary">
              <span className="selected-exercise-label">Selected exercise</span>
              <strong className="selected-exercise-name">
                {selectedExerciseName}
              </strong>
              <span className="selected-exercise-meta">
                {cycleCount} cycle{cycleCount === 1 ? "" : "s"} target
              </span>
            </div>
            <div className={`phase-pill phase-${activePhase.key}`}>
              {activePhase.label}
            </div>
            <div className="breath-visual" aria-hidden="true">
              {visualShape === "lotus" ? (
                <>
                  <span className="petal-center" />
                  <span className="petal petal-1" />
                  <span className="petal petal-2" />
                  <span className="petal petal-3" />
                  <span className="petal petal-4" />
                  <span className="petal petal-5" />
                  <span className="petal petal-6" />
                </>
              ) : visualShape === "crystal" ? (
                <>
                  <span className="crystal-outer" />
                  <span className="crystal-inner" />
                </>
              ) : visualShape === "ripple" ? (
                <>
                  <span className="ripple-center" />
                  <span className="ripple-ring ripple-ring-1" />
                  <span className="ripple-ring ripple-ring-2" />
                  <span className="ripple-ring ripple-ring-3" />
                </>
              ) : (
                <>
                  <span className="breath-core" />
                  <span className="breath-orb orb-one" />
                  <span className="breath-orb orb-two" />
                  <span className="breath-orb orb-three" />
                </>
              )}
            </div>
            <div className="countdown-number">{secondsRemaining}</div>
            <p className="phase-hint">{activePhase.hint}</p>

            <div className="breathing-controls">
              {!isRunning ? (
                <button
                  type="button"
                  className="control-btn primary"
                  onClick={handleStart}
                >
                  Start
                </button>
              ) : (
                <button
                  type="button"
                  className="control-btn secondary"
                  onClick={handlePause}
                >
                  Pause
                </button>
              )}
              <button
                type="button"
                className="control-btn ghost"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>

            <div className="breathing-stats">
              <span>
                Completed cycles: {completedCycles}/{cycleCount}
              </span>
              <span>Total cycle: {totalCycleSeconds} sec</span>
            </div>

            <section className="saved-profiles-panel">
              <div className="saved-profiles-header">
                <h3>Choose a breathing exercise.</h3>
              </div>

              {profilesLoading && (
                <p className="saved-profiles-empty">Loading profiles...</p>
              )}
              {!profilesLoading && profileError && !profiles.length && (
                <p className="saved-profiles-empty">{profileError}</p>
              )}

              <div className="saved-profiles-list">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    className={`saved-profile-card ${activeProfileId === profile.id ? "active" : ""}`}
                    onClick={() => handleApplyProfile(profile)}
                  >
                    <div className="saved-profile-head">
                      <span className="saved-profile-name">{profile.name}</span>
                      <span className="saved-profile-icon" aria-hidden="true">
                        {getProfileIcon(profile)}
                      </span>
                    </div>
                    <span className="saved-profile-meta">
                      {profile.inhale_seconds}-{profile.hold_seconds}-
                      {profile.exhale_seconds} sec
                    </span>
                    <span className="saved-profile-meta">
                      Audio{" "}
                      {profile.audio_enabled
                        ? `on • ${normalizeAudioLevel(profile.audio_level)}`
                        : "off"}
                    </span>
                  </button>
                ))}
                {PRESET_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    className={`saved-profile-card preset-profile-card ${activeProfileId === String(profile.id) ? "active" : ""}`}
                    onClick={() => handleApplyProfile(profile)}
                  >
                    <div className="saved-profile-head">
                      <span className="saved-profile-name">{profile.name}</span>
                      <span className="saved-profile-icon" aria-hidden="true">
                        {getProfileIcon(profile)}
                      </span>
                    </div>
                    <span className="saved-profile-meta">
                      {profile.inhale_seconds}-{profile.hold_seconds}-
                      {profile.exhale_seconds} sec
                    </span>
                    <span className="saved-profile-meta">
                      Audio{" "}
                      {profile.audio_enabled
                        ? `on • ${normalizeAudioLevel(profile.audio_level)}`
                        : "off"}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </article>
        )}
      </div>
    </section>
  );
};

export default BreathingExercise;