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
        position: 'top'
      },
      title: {
        display: true,
        text: isMoodTab ? 'Last 11 Mood Records' : 'Last 11 Sleep Records'
      }
    },
    scales: {
      y: {
        beginAtZero: !isMoodTab,
        min: isMoodTab ? 1 : 0,
        max: isMoodTab ? 10 : 24,
        ticks: {
          stepSize: isMoodTab ? 1 : 2
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
      {selectedIdx !== null && (
        <div className="chart-info">
          <p>Click on a point to see details for that day</p>
        </div>
      )}
    </div>
  );
};

export default MoodChart;
