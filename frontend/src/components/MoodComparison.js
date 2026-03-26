import React from 'react';
import '../styles/MoodComparison.scss';

const MoodComparison = ({ comparison }) => {
  if (!comparison) return null;

  const getMoodTrend = (change) => {
    if (change > 10) return '📈 Improved significantly';
    if (change > 0) return '📈 Slight improvement';
    if (change === 0) return '➡️ No change';
    return '📉 Declined';
  };

  const getSleepTrend = (change) => {
    if (change > 10) return '📈 More sleep';
    if (change > 0) return '📈 Slightly more sleep';
    if (change === 0) return '➡️ Same sleep';
    return '📉 Less sleep';
  };

  return (
    <div className="mood-comparison">
      <div className="comparison-grid">
        <div className="comparison-card">
          <h3>Mood</h3>
          <div className="current">
            <div className="label">Last 5 check-ins</div>
            <div className="value">{parseFloat(comparison.current.mood).toFixed(1)}</div>
          </div>
          <div className="previous">
            <div className="label">Previous 5</div>
            <div className="value">{parseFloat(comparison.previous.mood).toFixed(1)}</div>
          </div>
          <div className={`change ${comparison.moodChange >= 0 ? 'positive' : 'negative'}`}>
            {getMoodTrend(comparison.moodChange)}
            <div className="percent">{comparison.moodChange > 0 ? '+' : ''}{comparison.moodChange}%</div>
          </div>
        </div>

        <div className="comparison-card">
          <h3>Sleep</h3>
          <div className="current">
            <div className="label">Last 5 check-ins</div>
            <div className="value">{parseFloat(comparison.current.sleep).toFixed(1)}h</div>
          </div>
          <div className="previous">
            <div className="label">Previous 5</div>
            <div className="value">{parseFloat(comparison.previous.sleep).toFixed(1)}h</div>
          </div>
          <div className={`change ${comparison.sleepChange >= 0 ? 'positive' : 'negative'}`}>
            {getSleepTrend(comparison.sleepChange)}
            <div className="percent">{comparison.sleepChange > 0 ? '+' : ''}{comparison.sleepChange}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodComparison;
