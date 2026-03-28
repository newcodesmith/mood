import React, { useState, useEffect, useRef } from 'react';
import AuthForm from './components/AuthForm';
import MoodForm from './components/MoodForm';
import TodaysEntry from './components/TodaysEntry';
import MoodChart from './components/MoodChart';
import MoodComparison from './components/MoodComparison';
import Settings from './components/Settings';
import BreathingExercise from './components/BreathingExercise';
import { authService, clearAuthToken, moodEntryService, userService } from './services/api';
import './styles/App.scss';

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStoredTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return localStorage.getItem('mood_theme') || 'light';
};

const shiftDateKey = (dateKey, offsetDays) => {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  const shifted = new Date(year, month - 1, day + offsetDays);
  const shiftedYear = shifted.getFullYear();
  const shiftedMonth = String(shifted.getMonth() + 1).padStart(2, '0');
  const shiftedDay = String(shifted.getDate()).padStart(2, '0');
  return `${shiftedYear}-${shiftedMonth}-${shiftedDay}`;
};

const buildComparisonFromEntries = (entries, todayKey) => {
  const normalizedEntries = entries.map((entry) => ({
    ...entry,
    dateKey: String(entry.date).slice(0, 10)
  }));

  const currentStartKey = shiftDateKey(todayKey, -6);
  const previousStartKey = shiftDateKey(todayKey, -13);
  const previousEndKey = shiftDateKey(todayKey, -7);

  const currentEntries = normalizedEntries.filter((entry) => entry.dateKey >= currentStartKey && entry.dateKey <= todayKey);
  const previousEntries = normalizedEntries.filter((entry) => entry.dateKey >= previousStartKey && entry.dateKey <= previousEndKey);

  const average = (items, field) => {
    const values = items
      .map((item) => Number(item?.[field]))
      .filter((value) => Number.isFinite(value));

    if (!values.length) {
      return { value: 0, count: 0 };
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    return { value: total / values.length, count: values.length };
  };

  const currentMood = average(currentEntries, 'mood');
  const previousMood = average(previousEntries, 'mood');
  const currentSleep = average(currentEntries, 'sleep');
  const previousSleep = average(previousEntries, 'sleep');
  const currentWater = average(currentEntries, 'water_oz');
  const previousWater = average(previousEntries, 'water_oz');
  const currentWeight = average(currentEntries, 'weight_lbs');
  const previousWeight = average(previousEntries, 'weight_lbs');

  const percentChange = (currentValue, previousValue, previousCount) => {
    if (!previousCount || previousValue === 0) {
      return 0;
    }

    return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
  };

  return {
    current: {
      mood: currentMood.value.toFixed(2),
      sleep: currentSleep.value.toFixed(2),
      water_oz: currentWater.value.toFixed(2),
      weight_lbs: currentWeight.value.toFixed(2),
      entryCount: currentEntries.length,
      sleepEntryCount: currentSleep.count,
      waterEntryCount: currentWater.count,
      weightEntryCount: currentWeight.count
    },
    previous: {
      mood: previousMood.value.toFixed(2),
      sleep: previousSleep.value.toFixed(2),
      water_oz: previousWater.value.toFixed(2),
      weight_lbs: previousWeight.value.toFixed(2),
      entryCount: previousEntries.length,
      sleepEntryCount: previousSleep.count,
      waterEntryCount: previousWater.count,
      weightEntryCount: previousWeight.count
    },
    waterChange: percentChange(currentWater.value, previousWater.value, previousWater.count),
    weightChange: percentChange(currentWeight.value, previousWeight.value, previousWeight.count),
    moodChange: percentChange(currentMood.value, previousMood.value, previousEntries.length),
    sleepChange: percentChange(currentSleep.value, previousSleep.value, previousSleep.count)
  };
};

function App() {
    const normalizeColorPalette = (value) => {
      const allowed = ['ocean', 'sunrise', 'forest', 'lavender', 'ember'];
      const normalized = String(value || '').trim().toLowerCase();
      return allowed.includes(normalized) ? normalized : 'ocean';
    };

    const getBreathingSettingsFromUser = (user) => {
      const normalizeDuration = (value, fallback) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
          return fallback;
        }

        return Math.max(1, Math.min(60, Math.round(parsed)));
      };

      const normalizeAudioLevel = (value, fallback) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
          return fallback;
        }

        const clamped = Math.max(0, Math.min(0.6, parsed));
        return Number(clamped.toFixed(2));
      };

      return {
        inhale: normalizeDuration(user?.breathing_inhale_seconds, 4),
        hold: normalizeDuration(user?.breathing_hold_seconds, 4),
        exhale: normalizeDuration(user?.breathing_exhale_seconds, 6),
        audioEnabled: typeof user?.breathing_audio_enabled === 'boolean' ? user.breathing_audio_enabled : true,
        audioLevel: normalizeAudioLevel(user?.breathing_audio_level, 0.22),
        colorPalette: normalizeColorPalette(user?.breathing_color_palette)
      };
    };

  const resolveThemePreference = (user, fallbackTheme = 'light') => {
    const serverTheme = String(user?.theme_preference || '').toLowerCase();
    return serverTheme === 'dark' ? 'dark' : serverTheme === 'light' ? 'light' : fallbackTheme;
  };
  const [theme, setTheme] = useState(getStoredTheme);
  const [savedTheme, setSavedTheme] = useState(getStoredTheme);
  const [currentUser, setCurrentUser] = useState(null);
  const [todaysEntry, setTodaysEntry] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const previousActiveTabRef = useRef('dashboard');
  const latestLoadRequestRef = useRef(0);
  const activeUserIdRef = useRef(null);

  useEffect(() => {
    activeUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mood_theme', savedTheme);
  }, [savedTheme]);

  useEffect(() => {
    const previousActiveTab = previousActiveTabRef.current;

    if (previousActiveTab === 'settings' && activeTab !== 'settings' && theme !== savedTheme) {
      setTheme(savedTheme);
    }

    previousActiveTabRef.current = activeTab;
  }, [activeTab, savedTheme, theme]);

  // Restore authenticated session on initial load.
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await authService.me();
        const preferredTheme = resolveThemePreference(response.data, getStoredTheme());
        setTheme(preferredTheme);
        setSavedTheme(preferredTheme);
        activeUserIdRef.current = response.data.id;
        setCurrentUser(response.data);
        loadUserData(response.data.id);
      } catch (error) {
        clearAuthToken();
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const loadUserData = async (userId) => {
    const requestId = ++latestLoadRequestRef.current;
    const localToday = getLocalDateString();

    try {
      const [todayRes, recentRes, allRes] = await Promise.all([
        moodEntryService.getToday(userId, localToday),
        moodEntryService.getRecent(userId),
        moodEntryService.getAll(userId)
      ]);

      // Ignore out-of-order responses from a previous account/session.
      if (requestId !== latestLoadRequestRef.current || activeUserIdRef.current !== userId) {
        return;
      }

      setTodaysEntry(todayRes.data);
      setRecentEntries(recentRes.data);
      setComparison(buildComparisonFromEntries(allRes.data, localToday));
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      if (requestId === latestLoadRequestRef.current) {
        setLoading(false);
      }
    }
  };

  const handleMoodSaved = () => {
    setEditingEntry(null);
    if (currentUser) {
      loadUserData(currentUser.id);
      setActiveTab('dashboard');
    }
  };

  const handleAuthSuccess = (user) => {
    const preferredTheme = resolveThemePreference(user, getStoredTheme());
    latestLoadRequestRef.current += 1;
    activeUserIdRef.current = user.id;
    setTheme(preferredTheme);
    setSavedTheme(preferredTheme);
    setCurrentUser(user);
    setTodaysEntry(null);
    setRecentEntries([]);
    setComparison(null);
    setSelectedEntry(null);
    setEditingEntry(null);
    setActiveTab('dashboard');
    loadUserData(user.id);
  };

  const handleLogout = () => {
    latestLoadRequestRef.current += 1;
    activeUserIdRef.current = null;
    clearAuthToken();
    setCurrentUser(null);
    setTodaysEntry(null);
    setRecentEntries([]);
    setComparison(null);
    setSelectedEntry(null);
    setEditingEntry(null);
    setActiveTab('dashboard');
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setActiveTab('log');
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setActiveTab('dashboard');
  };

  const handleDeleteEntry = (deletedEntryId) => {
    setEditingEntry(null);

    if (selectedEntry?.id === deletedEntryId) {
      setSelectedEntry(null);
    }

    if (todaysEntry?.id === deletedEntryId) {
      setTodaysEntry(null);
    }

    if (currentUser) {
      loadUserData(currentUser.id);
    }

    setActiveTab('dashboard');
  };

  const handleThemeChange = (nextTheme, options = {}) => {
    setTheme(nextTheme);

    if (options.persist) {
      setSavedTheme(nextTheme);
    }
  };

  const handleBreathingSettingsSave = async (nextSettings) => {
    if (!currentUser?.id) {
      return false;
    }

    try {
      const response = await userService.updatePreferences(currentUser.id, {
        breathingInhaleSeconds: nextSettings.inhale,
        breathingHoldSeconds: nextSettings.hold,
        breathingExhaleSeconds: nextSettings.exhale,
        breathingAudioEnabled: nextSettings.audioEnabled,
        breathingAudioLevel: nextSettings.audioLevel,
        breathingColorPalette: nextSettings.colorPalette
      });

      setCurrentUser(response.data);
      return true;
    } catch (error) {
      console.error('Failed to save breathing settings:', error);
      return false;
    }
  };

  const moodValues = recentEntries
    .map((entry) => Number(entry?.mood))
    .filter((value) => Number.isFinite(value));
  const sleepValues = recentEntries
    .map((entry) => Number(entry?.sleep))
    .filter((value) => Number.isFinite(value));
  const waterValues = recentEntries
    .map((entry) => Number(entry?.water_oz))
    .filter((value) => Number.isFinite(value));
  const weightValues = recentEntries
    .map((entry) => Number(entry?.weight_lbs))
    .filter((value) => Number.isFinite(value));
  const averageMood = moodValues.length
    ? moodValues.reduce((sum, value) => sum + value, 0) / moodValues.length
    : 0;
  const averageSleep = sleepValues.length
    ? sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length
    : 0;
  const averageWater = waterValues.length
    ? waterValues.reduce((sum, value) => sum + value, 0) / waterValues.length
    : 0;
  const averageWeight = weightValues.length
    ? weightValues.reduce((sum, value) => sum + value, 0) / weightValues.length
    : 0;
  const moodGaugeValue = Math.max(0, Math.min(100, Math.round((averageMood / 10) * 100)));
  const sleepGaugeValue = Math.max(0, Math.min(100, Math.round((averageSleep / 10) * 100)));
  const waterGaugeValue = Math.max(0, Math.min(100, Math.round((averageWater / 128) * 100)));
  const weightGaugeValue = weightValues.length
    ? Math.max(0, Math.min(100, Math.round((averageWeight / 300) * 100)))
    : 0;
  const totalCheckIns = recentEntries.length;
  const latestWeight = weightValues.length ? weightValues[weightValues.length - 1] : null;
  const averageMoodIcon =
    totalCheckIns === 0
      ? '🙂'
      : averageMood <= 3
        ? '😞'
        : averageMood <= 5
          ? '😐'
          : averageMood <= 7
            ? '🙂'
            : '😄';

  const formatChange = (value) => {
    if (!Number.isFinite(Number(value)) || Number(value) === 0) {
      return 'Baseline building';
    }

    return `${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(1)}% vs previous week`;
  };

  const healthPillars = [
    {
      key: 'mood',
      title: 'Mood',
      icon: averageMoodIcon,
      value: `${averageMood ? averageMood.toFixed(1) : '0.0'}/10`,
      track: moodGaugeValue,
      detail: formatChange(comparison?.moodChange),
      insight: averageMood >= 7 ? 'Mini insight: steady positive emotional trend.' : averageMood >= 5 ? 'Mini insight: moderate mood stability this window.' : 'Mini insight: lower mood trend, consider recovery habits.'
    },
    {
      key: 'sleep',
      title: 'Sleep',
      icon: '🌙',
      value: `${averageSleep ? averageSleep.toFixed(1) : '0.0'}h`,
      track: sleepGaugeValue,
      detail: formatChange(comparison?.sleepChange),
      insight: averageSleep >= 7 ? 'Mini insight: sleep duration is in a strong range.' : averageSleep >= 6 ? 'Mini insight: sleep is fair, small gains could help recovery.' : 'Mini insight: short sleep trend, prioritize consistency.'
    },
    {
      key: 'water',
      title: 'Hydration',
      icon: '💧',
      value: `${averageWater ? averageWater.toFixed(1) : '0.0'} oz`,
      track: waterGaugeValue,
      detail: formatChange(comparison?.waterChange),
      insight: averageWater >= 64 ? 'Mini insight: hydration is meeting a common daily target.' : 'Mini insight: hydration is below target; add water reminders.'
    },
    {
      key: 'weight',
      title: 'Weight',
      icon: '⚖️',
      value: `${averageWeight ? averageWeight.toFixed(1) : '0.0'} lbs`,
      track: weightGaugeValue,
      detail: formatChange(comparison?.weightChange),
      insight: latestWeight === null ? 'Mini insight: add weight logs for trend visibility.' : `Mini insight: latest recorded weight is ${latestWeight.toFixed(1)} lbs.`
    }
  ];

  if (loading) {
    return <div className="app loading">Loading...</div>;
  }

  if (!currentUser) {
    return (
      <div className="app">
        <AuthForm onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">
              <span className="dot dot-one" />
              <span className="dot dot-two" />
              <span className="dot dot-three" />
            </div>
            <div className="brand-copy">
              <h1>Health Tracker</h1>
              <p>Track patterns across your health</p>
            </div>
          </div>
        </div>

        <div className="header-center">
        </div>

        <div className="header-right">
          {currentUser && (
            <>
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
                aria-expanded={mobileMenuOpen}
              >
                ☰
              </button>
              <div className="user-section">
                <div className="user-info">
                  {currentUser.avatar && <img src={currentUser.avatar} alt={currentUser.name} className="user-avatar" />}
                  <button
                    type="button"
                    className={`user-name-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                    title="Open settings"
                  >
                    {currentUser.name}
                  </button>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Sign out">
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>

        {currentUser && (
          <>
            <div
              className={`mobile-menu-backdrop ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
              <div className="mobile-menu-header">
                <div className="user-info-mobile">
                  {currentUser.avatar && <img src={currentUser.avatar} alt={currentUser.name} className="user-avatar" />}
                  <div>
                    <p className="user-name-mobile">{currentUser.name}</p>
                    <p className="user-email-mobile">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  className="mobile-menu-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>
              <nav className="mobile-menu-nav">
                <button
                  className="mobile-menu-item"
                  onClick={() => {
                    setActiveTab('breathing');
                    setMobileMenuOpen(false);
                  }}
                >
                  🌬️ Breathing
                </button>
                <button
                  className="mobile-menu-item"
                  onClick={() => {
                    setActiveTab('settings');
                    setMobileMenuOpen(false);
                  }}
                >
                  ⚙️ Settings
                </button>
                <button
                  className="mobile-menu-item logout"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  🚪 Sign Out
                </button>
              </nav>
            </div>
          </>
        )}
      </header>

      {currentUser && (
        <nav className="app-nav">
          <button
            className={`header-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`header-nav-btn ${activeTab === 'log' ? 'active' : ''}`}
            onClick={() => setActiveTab('log')}
          >
            ✏️ Log Check-In
          </button>
          <button
            className={`header-nav-btn ${activeTab === 'breathing' ? 'active' : ''}`}
            onClick={() => setActiveTab('breathing')}
          >
            🌬️ Breathing
          </button>
        </nav>
      )}

      <main className="app-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            {recentEntries.length === 0 && (
              <section className="dashboard-section empty-state dashboard-empty-state">
                <div className="empty-state-content">
                  <h3>👋 Welcome to Health Tracker!</h3>
                  <p>Start by logging your first health check-in to see your data here.</p>
                  <button className="cta-button" onClick={() => setActiveTab('log')}>Log Your First Check-In</button>
                </div>
              </section>
            )}

            <section className="dashboard-section dashboard-summary">
              <div className="summary-header">
                <h2>
                  <span className="section-icon" aria-hidden="true">✨</span>
                  Quick Insights
                </h2>
                <p className="section-description">A visual snapshot of your latest health check-ins.</p>
                <p className="summary-meta">{totalCheckIns} check-ins in your current 11-entry trend window.</p>
              </div>
              <div className="health-pillars-grid">
                {healthPillars.map((pillar) => (
                  <article key={pillar.key} className="health-pillar-card">
                    <div className="health-pillar-head">
                      <h3>{pillar.title}</h3>
                      <span className="summary-icon" aria-hidden="true">{pillar.icon}</span>
                    </div>
                    <p className="summary-value">{pillar.value}</p>
                    <div className="summary-bar-track" aria-hidden="true">
                      <span style={{ width: `${pillar.track}%` }} />
                    </div>
                    <p className="summary-note">{pillar.detail}</p>
                    <p className="summary-note summary-note-strong">{pillar.insight}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-section dashboard-daily-mood">
              <div className="section-header">
                <h2>
                  <span className="section-icon" aria-hidden="true">💬</span>
                  Today's Check-In
                </h2>
                <p className="section-description">Your health tracking details for today</p>
              </div>
              <TodaysEntry entry={todaysEntry} onEdit={handleEditEntry} onLogMood={() => setActiveTab('log')} />
            </section>

            {selectedEntry && (
              <section className="dashboard-section dashboard-entry-details">
                <div className="section-header">
                  <h2>
                    <span className="section-icon" aria-hidden="true">🧾</span>
                    Entry Details
                  </h2>
                  <p className="section-description">Full information for the selected date</p>
                </div>
                <div className="entry-card">
                  <p><strong>Date:</strong> {new Date(selectedEntry.date).toLocaleDateString()}</p>
                  <p><strong>Mood:</strong> {selectedEntry.mood}/10</p>
                  <p><strong>Feelings:</strong> {typeof selectedEntry.feelings === 'string' ? JSON.parse(selectedEntry.feelings).join(', ') : selectedEntry.feelings.join(', ')}</p>
                  {selectedEntry.reflection && <p><strong>Reflection:</strong> {selectedEntry.reflection}</p>}
                  {selectedEntry.sleep !== null && selectedEntry.sleep !== undefined && <p><strong>Sleep:</strong> {selectedEntry.sleep} hours</p>}
                  {selectedEntry.water_oz !== null && selectedEntry.water_oz !== undefined && <p><strong>Water:</strong> {selectedEntry.water_oz} oz</p>}
                  {selectedEntry.weight_lbs !== null && selectedEntry.weight_lbs !== undefined && <p><strong>Weight:</strong> {selectedEntry.weight_lbs} lbs</p>}
                  <button type="button" className="inline-action-btn" onClick={() => handleEditEntry(selectedEntry)}>
                    Edit This Entry
                  </button>
                </div>
              </section>
            )}

            <section className="dashboard-section dashboard-insights">
              <div className="section-header">
                <h2>
                  <span className="section-icon" aria-hidden="true">📊</span>
                  Weekly Health Insights
                </h2>
                <p className="section-description">Compare mood, sleep, water, and weight week-over-week</p>
              </div>
              <MoodComparison comparison={comparison} />
            </section>

            <section className="dashboard-section dashboard-trends">
              <div className="section-header">
                <h2>
                  <span className="section-icon" aria-hidden="true">📈</span>
                  Health Trends
                </h2>
                <p className="section-description">Visual history of your last 11 health check-ins. Click on any point to see details.</p>
              </div>
              <MoodChart entries={recentEntries} onSelectEntry={handleSelectEntry} />
            </section>
          </div>
        )}

        {activeTab === 'log' && (
          <MoodForm
            userId={currentUser?.id}
            entryToEdit={editingEntry}
            todaysEntry={todaysEntry}
            onSuccess={handleMoodSaved}
            onCancel={handleCancelEdit}
            onStartEditToday={(entry = todaysEntry) => handleEditEntry(entry)}
            onDelete={handleDeleteEntry}
          />
        )}

        {activeTab === 'settings' && currentUser && (
          <Settings
            user={currentUser}
            onUpdate={handleUserUpdate}
            theme={theme}
            onThemeChange={handleThemeChange}
          />
        )}

        {activeTab === 'breathing' && currentUser && (
          <BreathingExercise
            userId={currentUser.id}
            settings={getBreathingSettingsFromUser(currentUser)}
            onSettingsChange={handleBreathingSettingsSave}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Take care of yourself. Your health trends matter.</p>
      </footer>
    </div>
  );
}

export default App;
