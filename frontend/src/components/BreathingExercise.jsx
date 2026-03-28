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

const PHASE_AUDIO = {
  inhale: { primary: 164.81, secondary: 207.65 },
  hold: { primary: 246.94, secondary: 311.13 },
  exhale: { primary: 146.83, secondary: 185.0 },
};

const COLOR_PALETTES = [
  {
    id: "ocean",
    label: "Ocean",
    core: ["#7edff5", "#0ea5a4", "#0a5f79"],
    orb: [
      "rgba(255, 255, 255, 0.96)",
      "rgba(71, 166, 226, 0.9)",
      "rgba(22, 88, 148, 0.96)",
    ],
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
    icon: "🌊",
    inhale_seconds: 4,
    hold_seconds: 4,
    exhale_seconds: 6,
    audio_enabled: true,
    audio_level: 0.18,
    color_palette: "ocean",
  },
  {
    id: "preset-focus-box",
    name: "Focus Box",
    icon: "🎯",
    inhale_seconds: 4,
    hold_seconds: 4,
    exhale_seconds: 4,
    audio_enabled: true,
    audio_level: 0.16,
    color_palette: "forest",
  },
  {
    id: "preset-deep-sleep",
    name: "Deep Sleep 4-7-8",
    icon: "🌙",
    inhale_seconds: 4,
    hold_seconds: 7,
    exhale_seconds: 8,
    audio_enabled: true,
    audio_level: 0.12,
    color_palette: "lavender",
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
    return 0.22;
  }

  const clamped = Math.max(0, Math.min(0.6, numeric));
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

const getProfileIcon = (profile) => {
  if (profile?.icon) {
    return profile.icon;
  }

  const inhale = Number(profile?.inhale_seconds) || 0;
  const hold = Number(profile?.hold_seconds) || 0;
  const exhale = Number(profile?.exhale_seconds) || 0;

  if (exhale >= inhale + 2) {
    return "🫁";
  }

  if (inhale === hold && hold === exhale) {
    return "📦";
  }

  return "✨";
};

const BreathingExercise = ({ userId, settings, onSettingsChange }) => {
  const [durations, setDurations] = useState({
    inhale: clampSeconds(settings?.inhale ?? 4),
    hold: clampSeconds(settings?.hold ?? 4),
    exhale: clampSeconds(settings?.exhale ?? 6),
  });
  const [cycleCount, setCycleCount] = useState(
    clampCycleCount(settings?.cycleCount ?? 5),
  );
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(durations.inhale);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [activeTab, setActiveTab] = useState("exercise");
  const [audioEnabled, setAudioEnabled] = useState(
    typeof settings?.audioEnabled === "boolean" ? settings.audioEnabled : true,
  );
  const [audioLevel, setAudioLevel] = useState(
    normalizeAudioLevel(settings?.audioLevel ?? 0.22),
  );
  const [colorPalette, setColorPalette] = useState(
    normalizeColorPalette(settings?.colorPalette),
  );
  const [saveState, setSaveState] = useState("idle");
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileSaveState, setProfileSaveState] = useState("idle");
  const [profileError, setProfileError] = useState("");
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [editingProfileId, setEditingProfileId] = useState(null);
  const audioContextRef = useRef(null);
  const activeCueRef = useRef(null);
  const previousPhaseIndexRef = useRef(phaseIndex);
  const latestSettingsRef = useRef(null);
  const saveStateTimeoutRef = useRef(null);
  const profileSaveTimeoutRef = useRef(null);
  const shouldStopAtCycleBoundaryRef = useRef(false);

  useEffect(() => {
    setDurations({
      inhale: clampSeconds(settings?.inhale ?? 4),
      hold: clampSeconds(settings?.hold ?? 4),
      exhale: clampSeconds(settings?.exhale ?? 6),
    });
    setCycleCount(clampCycleCount(settings?.cycleCount ?? 5));
    setAudioEnabled(
      typeof settings?.audioEnabled === "boolean"
        ? settings.audioEnabled
        : true,
    );
    setAudioLevel(normalizeAudioLevel(settings?.audioLevel ?? 0.22));
    setColorPalette(normalizeColorPalette(settings?.colorPalette));
  }, [
    settings?.audioEnabled,
    settings?.audioLevel,
    settings?.cycleCount,
    settings?.colorPalette,
    settings?.exhale,
    settings?.hold,
    settings?.inhale,
  ]);

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
      gain.gain.cancelScheduledValues(now);
      const safeLevel = Math.max(gain.gain.value, 0.0001);
      gain.gain.setValueAtTime(safeLevel, now);
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

      const phaseSound = PHASE_AUDIO[phaseKey];
      const context = ensureAudioContext();
      if (!context || !phaseSound) {
        return;
      }

      const now = context.currentTime;
      const phaseDurationSeconds = Math.max(
        0.35,
        Number(durations[phaseKey]) || 1,
      );
      const fadeInTime = Math.min(0.35, phaseDurationSeconds * 0.2);
      const endTime = now + phaseDurationSeconds;
      const fadeOutStart = now + phaseDurationSeconds * 0.5;
      const fadeMidpoint = now + phaseDurationSeconds * 0.75;

      stopActiveCue(0.03);

      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(520, now);
      filter.frequency.linearRampToValueAtTime(360, endTime);
      filter.Q.setValueAtTime(1.1, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(audioLevel, now + fadeInTime);
      gain.gain.setValueAtTime(audioLevel, fadeOutStart);
      gain.gain.linearRampToValueAtTime(
        Math.max(audioLevel * 0.45, 0.0003),
        fadeMidpoint,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
      gain.connect(filter);
      filter.connect(context.destination);

      const oscPrimary = context.createOscillator();
      oscPrimary.type = "square";
      oscPrimary.frequency.setValueAtTime(phaseSound.primary, now);
      oscPrimary.connect(gain);

      const oscSecondary = context.createOscillator();
      oscSecondary.type = "sawtooth";
      oscSecondary.frequency.setValueAtTime(phaseSound.secondary, now);
      oscSecondary.detune.setValueAtTime(-10, now);
      oscSecondary.connect(gain);

      oscPrimary.start(now);
      oscSecondary.start(now);
      oscPrimary.stop(endTime);
      oscSecondary.stop(endTime);

      activeCueRef.current = {
        gain,
        oscillators: [oscPrimary, oscSecondary],
      };

      oscSecondary.onended = () => {
        if (activeCueRef.current?.oscillators?.includes(oscSecondary)) {
          activeCueRef.current = null;
        }
      };
    },
    [audioEnabled, audioLevel, durations, ensureAudioContext, stopActiveCue],
  );

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current > 1) {
          return current - 1;
        }

        let nextSeconds = durations.inhale;

        setPhaseIndex((currentPhaseIndex) => {
          const nextPhaseIndex = (currentPhaseIndex + 1) % PHASES.length;

          if (nextPhaseIndex === 0) {
            setCompletedCycles((cycles) => {
              const nextCompletedCycles = cycles + 1;
              if (nextCompletedCycles >= cycleCount) {
                shouldStopAtCycleBoundaryRef.current = true;
              }
              return nextCompletedCycles;
            });
            nextSeconds = durations.inhale;
          } else {
            nextSeconds = durations[PHASES[nextPhaseIndex].key];
          }

          return nextPhaseIndex;
        });

        return nextSeconds;
      });
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [cycleCount, durations, isRunning]);

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
    setPhaseIndex(0);
    setSecondsRemaining(durations.inhale);
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
    };

    const serialized = JSON.stringify(nextSettings);
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

      if (!isRunning && PHASES[phaseIndex].key === key) {
        setSecondsRemaining(nextValue);
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
      setPhaseIndex(0);
      setSecondsRemaining(durations.inhale);
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
    setAudioEnabled(Boolean(profile.audio_enabled));
    setAudioLevel(normalizeAudioLevel(profile.audio_level));
    if (profile.color_palette) {
      setColorPalette(normalizeColorPalette(profile.color_palette));
    }
    setActiveProfileId(String(profile.id));
    setPhaseIndex(0);
    setSecondsRemaining(nextDurations.inhale);
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
    setDurations({
      inhale: clampSeconds(profile.inhale_seconds),
      hold: clampSeconds(profile.hold_seconds),
      exhale: clampSeconds(profile.exhale_seconds),
    });
    setAudioEnabled(Boolean(profile.audio_enabled));
    setAudioLevel(normalizeAudioLevel(profile.audio_level));
    setPhaseIndex(0);
    setSecondsRemaining(clampSeconds(profile.inhale_seconds));
    setCompletedCycles(0);
    stopActiveCue(0.03);
    setIsRunning(false);
  };

  const handleStart = () => {
    const shouldRestartCycleSet = completedCycles >= cycleCount;

    shouldStopAtCycleBoundaryRef.current = false;
    if (shouldRestartCycleSet) {
      setPhaseIndex(0);
      setCompletedCycles(0);
      setSecondsRemaining(durations.inhale);
    }

    if (audioEnabled) {
      playPhaseCue(PHASES[shouldRestartCycleSet ? 0 : phaseIndex].key);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    shouldStopAtCycleBoundaryRef.current = false;
    stopActiveCue(0.03);
    setIsRunning(false);
  };

  const handleReset = () => {
    shouldStopAtCycleBoundaryRef.current = false;
    stopActiveCue(0.03);
    setIsRunning(false);
    setPhaseIndex(0);
    setCompletedCycles(0);
    setSecondsRemaining(durations.inhale);
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
          onClick={() => setActiveTab("exercise")}
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
                        className={`saved-profile-card ${activeProfileId === profile.id ? "active" : ""}`}
                      >
                        <div className="saved-profile-head">
                          <span className="saved-profile-name">
                            {profile.name}
                          </span>
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
                            Load
                          </button>
                          <button
                            type="button"
                            className="control-btn ghost"
                            onClick={() => handleEditProfile(profile)}
                          >
                            Edit
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
              <label
                className="audio-toggle-row"
                htmlFor="breathing-audio-enabled"
              >
                <span>Play calming tones for inhale, hold, and exhale</span>
                <input
                  id="breathing-audio-enabled"
                  type="checkbox"
                  checked={audioEnabled}
                  onChange={handleAudioEnabledChange}
                />
              </label>

              <label
                className="audio-volume-row"
                htmlFor="breathing-audio-volume"
              >
                <span>Volume</span>
                <input
                  id="breathing-audio-volume"
                  type="range"
                  min="0"
                  max="0.6"
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
              <h4>Shape Colors</h4>
              <p className="breathing-settings-help">
                Choose a color palette for the breathing shape.
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
                  {profileSaveState === "error" &&
                    (profileError || "Could not save profile")}
                </div>
              </div>
            </section>
          </article>
        )}

        {activeTab === "exercise" && (
          <article
            className={`breathing-player-card phase-state-${activePhase.key} ${isRunning ? "is-running" : "is-paused"}`}
            style={{
              "--phase-ms": `${durations[activePhase.key] * 1000}ms`,
              "--core-1": selectedPalette.core[0],
              "--core-2": selectedPalette.core[1],
              "--core-3": selectedPalette.core[2],
              "--orb-1": selectedPalette.orb[0],
              "--orb-2": selectedPalette.orb[1],
              "--orb-3": selectedPalette.orb[2],
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
              <span className="breath-core" />
              <span className="breath-orb orb-one" />
              <span className="breath-orb orb-two" />
              <span className="breath-orb orb-three" />
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
