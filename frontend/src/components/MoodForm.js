import React, { useEffect, useState } from 'react';
import { moodEntryService } from '../services/api';
import '../styles/MoodForm.scss';

const MoodForm = ({ userId, entryToEdit = null, onSuccess, onCancel }) => {
  const [mood, setMood] = useState('5');
  const [feelings, setFeelings] = useState([]);
  const [reflection, setReflection] = useState('');
  const [sleep, setSleep] = useState('');
  const [errors, setErrors] = useState({});

  const feelingsOptions = ['Happy', 'Sad', 'Anxious', 'Calm', 'Energetic', 'Tired', 'Hopeful', 'Stressed'];

  useEffect(() => {
    if (!entryToEdit) {
      setMood('5');
      setFeelings([]);
      setReflection('');
      setSleep('');
      setErrors({});
      return;
    }

    const parsedFeelings = typeof entryToEdit.feelings === 'string'
      ? JSON.parse(entryToEdit.feelings)
      : (entryToEdit.feelings || []);

    setMood(String(entryToEdit.mood ?? '5'));
    setFeelings(parsedFeelings);
    setReflection(entryToEdit.reflection || '');
    setSleep(entryToEdit.sleep ?? '');
    setErrors({});
  }, [entryToEdit]);

  const handleFeelingToggle = (feeling) => {
    if (feelings.includes(feeling)) {
      setFeelings(feelings.filter(f => f !== feeling));
    } else {
      setFeelings([...feelings, feeling]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!mood) newErrors.mood = 'Mood is required';
    if (feelings.length === 0) newErrors.feelings = 'At least one feeling is required';
    if (sleep && (isNaN(sleep) || sleep < 0 || sleep > 24)) newErrors.sleep = 'Sleep must be 0-24';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        mood: parseInt(mood, 10),
        feelings,
        reflection: reflection || null,
        sleep: sleep ? parseFloat(sleep) : null
      };

      if (entryToEdit?.id) {
        await moodEntryService.update(entryToEdit.id, payload);
      } else {
        const today = new Date().toISOString().split('T')[0];
        await moodEntryService.create({
          userId,
          date: today,
          ...payload
        });
      }

      setMood('5');
      setFeelings([]);
      setReflection('');
      setSleep('');
      setErrors({});
      onSuccess && onSuccess();
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || 'Failed to save entry' });
    }
  };

  return (
    <form className="mood-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>{entryToEdit ? 'Edit Mood Entry' : 'Log Your Mood'}</h2>
        <p>
          {entryToEdit
            ? 'Update your mood details to keep your record accurate.'
            : 'Take a moment to reflect on how you\'re feeling. This entry will help you understand your emotional patterns.'}
        </p>
      </div>
      
      <div className="form-group">
        <label>How are you feeling? <span className="required">*</span></label>
        <div className="mood-slider-container">
          <input
            type="range"
            min="1"
            max="10"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="mood-slider"
          />
          <div className="mood-display">
            <span className="mood-value">{mood}</span>
            <span className="mood-text">
              {mood <= 3 ? '😢 Not good' : mood <= 5 ? '😐 Neutral' : mood <= 7 ? '🙂 Good' : '😊 Great'}
            </span>
          </div>
        </div>
        <div className="mood-labels">
          <span>1 = Poor</span>
          <span>5 = Neutral</span>
          <span>10 = Excellent</span>
        </div>
      </div>

      <div className="form-group">
        <label>What are you feeling? <span className="required">*</span></label>
        <p className="field-description">Select one or more emotions that match your current state</p>
        <div className="feelings-grid">
          {feelingsOptions.map(feeling => (
            <button
              key={feeling}
              type="button"
              className={`feeling-btn ${feelings.includes(feeling) ? 'active' : ''}`}
              onClick={() => handleFeelingToggle(feeling)}
            >
              {feeling}
            </button>
          ))}
        </div>
        {errors.feelings && <span className="error">{errors.feelings}</span>}
      </div>

      <div className="form-group">
        <label>What's on your mind?</label>
        <p className="field-description">Optional: Write down any thoughts, events, or reflections from your day</p>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="e.g., Had a great day at work, feeling accomplished..."
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Sleep last night (hours)</label>
        <p className="field-description">Optional: How many hours of sleep did you get?</p>
        <input
          type="number"
          step="0.5"
          min="0"
          max="24"
          value={sleep}
          onChange={(e) => setSleep(e.target.value)}
          placeholder="e.g., 7.5"
        />
        {errors.sleep && <span className="error">{errors.sleep}</span>}
      </div>

      {errors.submit && <div className="error-message">{errors.submit}</div>}
      <div className="form-actions-row">
        {entryToEdit && (
          <button type="button" className="secondary-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="submit-btn">{entryToEdit ? 'Update Mood Entry' : 'Save Mood Entry'}</button>
      </div>
    </form>
  );
};

export default MoodForm;
