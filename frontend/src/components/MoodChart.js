import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../styles/MoodChart.scss';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MoodChart = ({ entries, onSelectEntry }) => {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [activeMetric, setActiveMetric] = useState('mood');
  const isDarkTheme =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark';

  if (!entries || entries.length === 0) {
    return <div className="mood-chart-empty">No data to display</div>;
  }

  const dates = entries.map(e => new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const moodScores = entries.map(e => Number(e.mood));
  const sleepScores = entries.map((e) => {
    const value = Number(e.sleep);
    return Number.isFinite(value) ? value : null;
  });
  const hasSleepData = sleepScores.some((value) => value !== null);

  const isMoodTab = activeMetric === 'mood';
  const chartValues = isMoodTab ? moodScores : sleepScores;

  const data = {
    labels: dates,
    datasets: [
      {
        label: isMoodTab ? 'Mood Score' : 'Sleep (hours)',
        data: chartValues,
        borderColor: isMoodTab ? '#0ea5a4' : '#2563eb',
        backgroundColor: isMoodTab ? 'rgba(14, 165, 164, 0.16)' : 'rgba(37, 99, 235, 0.14)',
        tension: 0.3,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: isMoodTab ? '#0ea5a4' : '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        spanGaps: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: isDarkTheme ? '#eaf3ff' : '#1f3146'
        }
      },
      title: {
        display: true,
        text: isMoodTab ? 'Last 11 Mood Records' : 'Last 11 Sleep Records',
        color: isDarkTheme ? '#f2f8ff' : '#173049'
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDarkTheme ? '#d9e7fb' : '#3f5774'
        },
        grid: {
          color: isDarkTheme ? 'rgba(177, 204, 238, 0.18)' : 'rgba(46, 87, 136, 0.12)'
        },
        border: {
          color: isDarkTheme ? 'rgba(177, 204, 238, 0.3)' : 'rgba(46, 87, 136, 0.2)'
        }
      },
      y: {
        beginAtZero: !isMoodTab,
        min: isMoodTab ? 1 : 0,
        max: isMoodTab ? 10 : 24,
        ticks: {
          stepSize: isMoodTab ? 1 : 2,
          color: isDarkTheme ? '#d9e7fb' : '#3f5774'
        },
        grid: {
          color: isDarkTheme ? 'rgba(177, 204, 238, 0.16)' : 'rgba(46, 87, 136, 0.1)'
        },
        border: {
          color: isDarkTheme ? 'rgba(177, 204, 238, 0.3)' : 'rgba(46, 87, 136, 0.2)'
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        setSelectedIdx(idx);
        onSelectEntry && onSelectEntry(entries[idx]);
      }
    }
  };

  return (
    <div className="mood-chart">
      <div className="chart-tabs" role="tablist" aria-label="Trend metric tabs">
        <button
          type="button"
          role="tab"
          aria-selected={isMoodTab}
          className={`chart-tab-btn ${isMoodTab ? 'active' : ''}`}
          onClick={() => {
            setActiveMetric('mood');
            setSelectedIdx(null);
          }}
        >
          Mood Trend
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isMoodTab}
          className={`chart-tab-btn ${!isMoodTab ? 'active' : ''}`}
          onClick={() => {
            setActiveMetric('sleep');
            setSelectedIdx(null);
          }}
        >
          Sleep Trend
        </button>
      </div>

      {!isMoodTab && !hasSleepData && (
        <div className="chart-no-data">No sleep data logged yet. Add sleep hours to see your sleep trend.</div>
      )}

      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
      <div className="chart-info">
        <p>
          {selectedIdx === null
            ? 'Click on a point to see details for that day.'
            : 'Point selected. Scroll down to the Entry Details card to view and edit it.'}
        </p>
      </div>
    </div>
  );
};

export default MoodChart;
