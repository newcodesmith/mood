import React from 'react';
import '../styles/MoodComparison.scss';

const MoodComparison = ({ comparison }) => {
  if (!comparison) return null;

  const currentMood = Number(comparison.current?.mood) || 0;
  const previousMood = Number(comparison.previous?.mood) || 0;
  const currentSleep = Number(comparison.current?.sleep) || 0;
  const previousSleep = Number(comparison.previous?.sleep) || 0;
  const moodDelta = currentMood - previousMood;
  const sleepDelta = currentSleep - previousSleep;
  const hasPreviousMoodData = Number(comparison.previous?.entryCount) > 0;
  const hasPreviousSleepData = Number(comparison.previous?.sleepEntryCount) > 0;

  const getMoodTrend = () => {
    if (!hasPreviousMoodData) return '➡️ Building baseline';
    if (moodDelta >= 1) return '📈 Improved significantly';
    if (moodDelta > 0) return '📈 Slight improvement';
    if (moodDelta === 0) return '➡️ No change';
    return '📉 Declined';
  };

  const getSleepTrend = () => {
    if (!hasPreviousSleepData) return '➡️ Building baseline';
    if (sleepDelta >= 1) return '📈 More sleep';
    if (sleepDelta > 0) return '📈 Slightly more sleep';
    if (sleepDelta === 0) return '➡️ Same sleep';
    return '📉 Less sleep';
  };

  return (
    <div className="mood-comparison">
      <div className="comparison-grid">
        <div className="comparison-card">
          <h3>Mood</h3>
          <div className="current">
            <div className="label">Last 7 days</div>
            <div className="value">{parseFloat(comparison.current.mood).toFixed(1)}</div>
          </div>
          <div className="previous">
            <div className="label">Previous 7 days</div>
            <div className="value">{parseFloat(comparison.previous.mood).toFixed(1)}</div>
          </div>
          <div className={`change ${comparison.moodChange >= 0 ? 'positive' : 'negative'}`}>
            {getMoodTrend()}
            <div className="percent">{comparison.moodChange > 0 ? '+' : ''}{comparison.moodChange}%</div>
          </div>
        </div>

        <div className="comparison-card">
          <h3>Sleep</h3>
          <div className="current">
            <div className="label">Last 7 days</div>
            <div className="value">{parseFloat(comparison.current.sleep).toFixed(1)}h</div>
          </div>
          <div className="previous">
            <div className="label">Previous 7 days</div>
            <div className="value">{parseFloat(comparison.previous.sleep).toFixed(1)}h</div>
          </div>
          <div className={`change ${comparison.sleepChange >= 0 ? 'positive' : 'negative'}`}>
            {getSleepTrend()}
            <div className="percent">{comparison.sleepChange > 0 ? '+' : ''}{comparison.sleepChange}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodComparison;
