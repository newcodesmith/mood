import React from 'react';
import '../styles/MoodComparison.scss';

const MoodComparison = ({ comparison }) => {
  if (!comparison) return null;

  const currentMood = Number(comparison.current?.mood) || 0;
  const previousMood = Number(comparison.previous?.mood) || 0;
  const currentSleep = Number(comparison.current?.sleep) || 0;
  const previousSleep = Number(comparison.previous?.sleep) || 0;
  const currentWater = Number(comparison.current?.water_oz) || 0;
  const previousWater = Number(comparison.previous?.water_oz) || 0;
  const currentWeight = Number(comparison.current?.weight_lbs) || 0;
  const previousWeight = Number(comparison.previous?.weight_lbs) || 0;
  const moodDelta = currentMood - previousMood;
  const sleepDelta = currentSleep - previousSleep;
  const waterDelta = currentWater - previousWater;
  const weightDelta = currentWeight - previousWeight;
  const hasPreviousMoodData = Number(comparison.previous?.entryCount) > 0;
  const hasPreviousSleepData = Number(comparison.previous?.sleepEntryCount) > 0;
  const hasPreviousWaterData = Number(comparison.previous?.waterEntryCount) > 0;
  const hasPreviousWeightData = Number(comparison.previous?.weightEntryCount) > 0;

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

  const getWaterTrend = () => {
    if (!hasPreviousWaterData) return '➡️ Building baseline';
    if (waterDelta >= 12) return '📈 Hydration up';
    if (waterDelta > 0) return '📈 Slightly more hydrated';
    if (waterDelta === 0) return '➡️ Same hydration';
    return '📉 Hydration down';
  };

  const getWeightTrend = () => {
    if (!hasPreviousWeightData) return '➡️ Building baseline';
    if (weightDelta >= 2) return '📈 Weight up';
    if (weightDelta > 0) return '📈 Slight increase';
    if (weightDelta === 0) return '➡️ Stable';
    if (weightDelta <= -2) return '📉 Weight down';
    return '📉 Slight decrease';
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

        <div className="comparison-card">
          <h3>Water</h3>
          <div className="current">
            <div className="label">Last 7 days</div>
            <div className="value">{currentWater.toFixed(1)} oz</div>
          </div>
          <div className="previous">
            <div className="label">Previous 7 days</div>
            <div className="value">{previousWater.toFixed(1)} oz</div>
          </div>
          <div className={`change ${comparison.waterChange >= 0 ? 'positive' : 'negative'}`}>
            {getWaterTrend()}
            <div className="percent">{comparison.waterChange > 0 ? '+' : ''}{comparison.waterChange}%</div>
          </div>
        </div>

        <div className="comparison-card">
          <h3>Weight</h3>
          <div className="current">
            <div className="label">Last 7 days</div>
            <div className="value">{currentWeight.toFixed(1)} lbs</div>
          </div>
          <div className="previous">
            <div className="label">Previous 7 days</div>
            <div className="value">{previousWeight.toFixed(1)} lbs</div>
          </div>
          <div className={`change ${comparison.weightChange >= 0 ? 'positive' : 'negative'}`}>
            {getWeightTrend()}
            <div className="percent">{comparison.weightChange > 0 ? '+' : ''}{comparison.weightChange}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodComparison;
