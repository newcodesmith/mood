import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import MoodForm from './components/MoodForm';
import TodaysEntry from './components/TodaysEntry';
import MoodChart from './components/MoodChart';
import MoodComparison from './components/MoodComparison';
import Settings from './components/Settings';
import { authService, clearAuthToken, moodEntryService } from './services/api';
import './styles/App.scss';

function App() {
  const storedTheme = localStorage.getItem('mood_theme') || 'light';
  const [theme, setTheme] = useState(storedTheme);
  const [savedTheme, setSavedTheme] = useState(storedTheme);
  const [currentUser, setCurrentUser] = useState(null);
  const [todaysEntry, setTodaysEntry] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const previousActiveTabRef = React.useRef('dashboard');

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
    try {
      const [todayRes, recentRes, comparisonRes] = await Promise.all([
        moodEntryService.getToday(userId),
        moodEntryService.getRecent(userId),
        moodEntryService.getComparison(userId)
      ]);

      setTodaysEntry(todayRes.data);
      setRecentEntries(recentRes.data);
      setComparison(comparisonRes.data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
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
    setCurrentUser(user);
    setActiveTab('dashboard');
    loadUserData(user.id);
  };

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setTodaysEntry(null);
    setRecentEntries([]);
    setComparison(null);
    setSelectedEntry(null);
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

  const handleThemeChange = (nextTheme, options = {}) => {
    setTheme(nextTheme);

    if (options.persist) {
      setSavedTheme(nextTheme);
    }
  };

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
              <h1>Mood Tracker</h1>
              <p>Track patterns, not just moments</p>
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
                <button
                  className={`settings-btn ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                  title="Settings"
                >
                  ⚙️
                </button>
                <div className="user-info">
                  {currentUser.avatar && <img src={currentUser.avatar} alt={currentUser.name} className="user-avatar" />}
                  <span className="user-name">{currentUser.name}</span>
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
            ✏️ Log Mood
          </button>
        </nav>
      )}

      <main className="app-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            {recentEntries.length === 0 && (
              <section className="dashboard-section empty-state">
                <div className="empty-state-content">
                  <h3>👋 Welcome to Mood Tracker!</h3>
                  <p>Start by logging your first mood entry to see your data here.</p>
                  <button className="cta-button" onClick={() => setActiveTab('log')}>Log Your First Mood</button>
                </div>
              </section>
            )}

            <section className="dashboard-section">
              <div className="section-header">
                <h2>Daily Mood</h2>
                <p className="section-description">Your mood entry for today</p>
              </div>
              <TodaysEntry entry={todaysEntry} onEdit={handleEditEntry} />
            </section>

            {selectedEntry && (
              <section className="dashboard-section">
                <div className="section-header">
                  <h2>Entry Details</h2>
                  <p className="section-description">Full information for the selected date</p>
                </div>
                <div className="entry-card">
                  <p><strong>Date:</strong> {new Date(selectedEntry.date).toLocaleDateString()}</p>
                  <p><strong>Mood:</strong> {selectedEntry.mood}/10</p>
                  <p><strong>Feelings:</strong> {typeof selectedEntry.feelings === 'string' ? JSON.parse(selectedEntry.feelings).join(', ') : selectedEntry.feelings.join(', ')}</p>
                  {selectedEntry.reflection && <p><strong>Reflection:</strong> {selectedEntry.reflection}</p>}
                  {selectedEntry.sleep && <p><strong>Sleep:</strong> {selectedEntry.sleep} hours</p>}
                  <button type="button" className="inline-action-btn" onClick={() => handleEditEntry(selectedEntry)}>
                    Edit This Entry
                  </button>
                </div>
              </section>
            )}

            <section className="dashboard-section">
              <div className="section-header">
                <h2>Weekly Insights</h2>
                <p className="section-description">Compare your mood and sleep patterns week-over-week</p>
              </div>
              <MoodComparison comparison={comparison} />
            </section>

            <section className="dashboard-section">
              <div className="section-header">
                <h2>Mood Trends</h2>
                <p className="section-description">Visual history of your last 11 mood entries. Click on any bar to see details.</p>
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
            onStartEditToday={() => handleEditEntry(todaysEntry)}
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
      </main>

      <footer className="app-footer">
        <p>Take care of yourself. Your mental health matters.</p>
      </footer>
    </div>
  );
}

export default App;
