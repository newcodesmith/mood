import React, { useEffect, useState } from 'react';
import { moodEntryService } from '../services/api';
import '../styles/MoodForm.scss';

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MoodForm = ({ userId, entryToEdit = null, todaysEntry = null, onSuccess, onCancel, onStartEditToday, onDelete }) => {
  const [mood, setMood] = useState('5');
  const [feelings, setFeelings] = useState([]);
  const [reflection, setReflection] = useState('');
  const [sleep, setSleep] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [existingEntryForDate, setExistingEntryForDate] = useState(null);
  const [checkingSelectedDate, setCheckingSelectedDate] = useState(false);
  const [errors, setErrors] = useState({});

  const feelingsOptions = ['Happy', 'Sad', 'Anxious', 'Calm', 'Energetic', 'Tired', 'Hopeful', 'Stressed'];
  const today = getLocalDateString();

  useEffect(() => {
    if (!entryToEdit) {
      setMood('5');
      setFeelings([]);
      setReflection('');
      setSleep('');
      setSelectedDate(getLocalDateString());
      setExistingEntryForDate(null);
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
    setSelectedDate(String(entryToEdit.date).split('T')[0]);
    setExistingEntryForDate(null);
    setErrors({});
  }, [entryToEdit]);

  useEffect(() => {
    let isActive = true;

    if (!userId || entryToEdit || !selectedDate) {
      setExistingEntryForDate(null);
      setCheckingSelectedDate(false);
      return undefined;
    }

    if (selectedDate === today && todaysEntry) {
      setExistingEntryForDate(todaysEntry);
      setCheckingSelectedDate(false);
      return undefined;
    }

    setCheckingSelectedDate(true);

    moodEntryService.getByDate(userId, selectedDate)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setExistingEntryForDate(response.data || null);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setExistingEntryForDate(null);
      })
      .finally(() => {
        if (isActive) {
          setCheckingSelectedDate(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [entryToEdit, selectedDate, today, todaysEntry, userId]);

  const handleFeelingToggle = (feeling) => {
    if (feelings.includes(feeling)) {
      setFeelings(feelings.filter(f => f !== feeling));
    } else {
      setFeelings([...feelings, feeling]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!selectedDate) newErrors.date = 'Date is required';
    if (!mood) newErrors.mood = 'Mood is required';
    if (feelings.length === 0) newErrors.feelings = 'At least one feeling is required';
    if (sleep && (isNaN(sleep) || sleep < 0 || sleep > 24)) newErrors.sleep = 'Sleep must be 0-24';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!entryToEdit && !Number.isFinite(Number(userId))) {
      setErrors({ submit: 'Session error. Please sign out and sign back in.' });
      return;
    }

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
        await moodEntryService.create({
          userId: Number(userId),
          date: selectedDate,
          ...payload
        });
      }

      setMood('5');
      setFeelings([]);
      setReflection('');
      setSleep('');
      setSelectedDate(getLocalDateString());
      setExistingEntryForDate(null);
      setErrors({});
      onSuccess && onSuccess();
    } catch (error) {
      const backendError = error.response?.data?.error;
      const isDuplicateForDate = typeof backendError === 'string' && backendError.toLowerCase().includes('already have an entry');
      setErrors({ submit: isDuplicateForDate ? 'You already have an entry for this date. Edit it instead or choose another date.' : (backendError || 'Failed to save entry') });
    }
  };

  const handleDelete = async () => {
    if (!entryToEdit?.id) {
      return;
    }

    const confirmed = window.confirm('Delete this mood entry? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      await moodEntryService.delete(entryToEdit.id);
      setErrors({});
      onDelete && onDelete(entryToEdit.id);
    } catch (error) {
      const backendError = error.response?.data?.error;
      setErrors({ submit: backendError || 'Failed to delete entry' });
    }
  };

  const selectedEntryAlreadyExists = !entryToEdit && !!existingEntryForDate;
  const isTodaySelected = selectedDate === today;

  return (
    <form className="mood-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>{entryToEdit ? 'Edit Mood Entry' : 'Log Your Mood'}</h2>
        <p>
          {entryToEdit
            ? 'Update your mood details to keep your record accurate.'
            : 'Take a moment to reflect on how you\'re feeling. You can log today or add an entry for a missed day.'}
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="entry-date">Entry date</label>
        <p className="field-description">Choose today or a past day you missed.</p>
        <input
          id="entry-date"
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          disabled={Boolean(entryToEdit)}
        />
        {errors.date && <span className="error">{errors.date}</span>}
      </div>

      {selectedEntryAlreadyExists && (
        <div className="existing-entry-notice">
          <p>
            {isTodaySelected
              ? 'You already logged mood for today.'
              : 'You already have a mood entry for the selected date.'}
          </p>
          <div className="limit-notice-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onStartEditToday && onStartEditToday(existingEntryForDate)}
            >
              Edit Existing Entry
            </button>
          </div>
        </div>
      )}

      {checkingSelectedDate && !entryToEdit && (
        <div className="date-check-note">Checking whether you already have an entry for this date…</div>
      )}

      {!selectedEntryAlreadyExists && (
      <>
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
          <button type="button" className="delete-btn" onClick={handleDelete}>
            Delete Entry
          </button>
        )}
        {entryToEdit && (
          <button type="button" className="secondary-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="submit-btn" disabled={checkingSelectedDate}>
          {entryToEdit ? 'Update Mood Entry' : 'Save Mood Entry'}
        </button>
      </div>
      </>
      )}
    </form>
  );
};

export default MoodForm;
