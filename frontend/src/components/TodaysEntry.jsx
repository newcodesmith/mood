import React from 'react';
import { getQuoteByMood } from '../services/quotes';
import '../styles/TodaysEntry.scss';

const TodaysEntry = ({ entry, onEdit, onLogMood }) => {
  if (!entry) {
    return (
      <div className="todays-entry empty">
        No entry for today yet.{` `}
        <button type="button" className="inline-action-btn" onClick={() => onLogMood && onLogMood()}>
          Log your mood now!
        </button>
      </div>
    );
  }

  const feelings = typeof entry.feelings === 'string' ? JSON.parse(entry.feelings) : entry.feelings;

  return (
    <div className="todays-entry">
      <div className="mood-display">
        <div className="mood-score">{entry.mood}</div>
        <div className="mood-label">out of 10</div>
      </div>

      <div className="quote">{getQuoteByMood(entry.mood)}</div>

      <div className="entry-detail">
        <h3>Feelings</h3>
        <div className="feelings-list">
          {feelings.map((feeling, idx) => (
            <span key={idx} className="feeling-tag">{feeling}</span>
          ))}
        </div>
      </div>

      {entry.reflection && (
        <div className="entry-detail">
          <h3>Reflection</h3>
          <p>{entry.reflection}</p>
        </div>
      )}

      {entry.sleep && (
        <div className="entry-detail">
          <h3>Sleep</h3>
          <p>{entry.sleep} hours</p>
        </div>
      )}

      <div className="entry-actions">
        <button type="button" className="edit-entry-btn" onClick={() => onEdit && onEdit(entry)}>
          Edit Entry
        </button>
      </div>
    </div>
  );
};

export default TodaysEntry;
