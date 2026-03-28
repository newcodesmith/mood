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

  const dates = entries.map((e) => new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

  const metricConfig = {
    mood: {
      key: 'mood',
      tabLabel: 'Mood Trend',
      label: 'Mood Score',
      title: 'Last 11 Mood Records',
      borderColor: '#0ea5a4',
      backgroundColor: 'rgba(14, 165, 164, 0.16)',
      min: 1,
      max: 10,
      stepSize: 1,
      beginAtZero: false,
      noData: 'No mood data logged yet.'
    },
    sleep: {
      key: 'sleep',
      tabLabel: 'Sleep Trend',
      label: 'Sleep (hours)',
      title: 'Last 11 Sleep Records',
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.14)',
      min: 0,
      max: 24,
      stepSize: 2,
      beginAtZero: true,
      noData: 'No sleep data logged yet. Add sleep hours to see your trend.'
    },
    water_oz: {
      key: 'water_oz',
      tabLabel: 'Water Trend',
      label: 'Water (oz)',
      title: 'Last 11 Water Intake Records',
      borderColor: '#0b75d1',
      backgroundColor: 'rgba(11, 117, 209, 0.14)',
      min: 0,
      max: 160,
      stepSize: 16,
      beginAtZero: true,
      noData: 'No water data logged yet. Add oz values to see hydration trends.'
    },
    weight_lbs: {
      key: 'weight_lbs',
      tabLabel: 'Weight Trend',
      label: 'Weight (lbs)',
      title: 'Last 11 Weight Records',
      borderColor: '#ef6c00',
      backgroundColor: 'rgba(239, 108, 0, 0.14)',
      min: null,
      max: null,
      stepSize: 5,
      beginAtZero: false,
      noData: 'No weight data logged yet. Add weight values to see your trend.'
    }
  };

  const metric = metricConfig[activeMetric] || metricConfig.mood;
  const chartValues = entries.map((entry) => {
    const value = Number(entry?.[metric.key]);
    return Number.isFinite(value) ? value : null;
  });
  const hasMetricData = chartValues.some((value) => value !== null);
  const presentValues = chartValues.filter((value) => value !== null);

  let yMin = metric.min;
  let yMax = metric.max;

  if (metric.key === 'weight_lbs' && presentValues.length) {
    const minValue = Math.min(...presentValues);
    const maxValue = Math.max(...presentValues);
    yMin = Math.max(0, Math.floor(minValue - 5));
    yMax = Math.ceil(maxValue + 5);
  }

  const data = {
    labels: dates,
    datasets: [
      {
        label: metric.label,
        data: chartValues,
        borderColor: metric.borderColor,
        backgroundColor: metric.backgroundColor,
        tension: 0.3,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: metric.borderColor,
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
        text: metric.title,
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
        beginAtZero: metric.beginAtZero,
        min: yMin,
        max: yMax,
        ticks: {
          stepSize: metric.stepSize,
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
        {Object.values(metricConfig).map((tabMetric) => (
          <button
            key={tabMetric.key}
            type="button"
            role="tab"
            aria-selected={activeMetric === tabMetric.key}
            className={`chart-tab-btn ${activeMetric === tabMetric.key ? 'active' : ''}`}
            onClick={() => {
              setActiveMetric(tabMetric.key);
              setSelectedIdx(null);
            }}
          >
            {tabMetric.tabLabel}
          </button>
        ))}
      </div>

      {!hasMetricData && (
        <div className="chart-no-data">{metric.noData}</div>
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
