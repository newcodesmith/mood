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

  if (!entries || entries.length === 0) {
    return <div className="mood-chart-empty">No data to display</div>;
  }

  const dates = entries.map(e => new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const moodScores = entries.map(e => e.mood);

  const data = {
    labels: dates,
    datasets: [
      {
        label: 'Mood Score',
        data: moodScores,
        borderColor: '#667bc6',
        backgroundColor: 'rgba(102, 123, 198, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#667bc6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Last 11 Mood Records'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 1,
        max: 10
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
      <Line data={data} options={options} />
      {selectedIdx !== null && (
        <div className="chart-info">
          <p>Click on a point to see details for that day</p>
        </div>
      )}
    </div>
  );
};

export default MoodChart;
