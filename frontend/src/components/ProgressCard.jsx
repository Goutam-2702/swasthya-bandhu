import React from 'react';

function ProgressCard({ title, value, target, percentage }) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  
  const getColor = () => {
    if (clampedPercentage >= 80) return '#27ae60'; // green
    if (clampedPercentage >= 60) return '#f39c12'; // orange
    return '#e74c3c'; // red
  };

  return (
    <div className="progress-card">
      <h4>{title}</h4>
      <div className="progress-value">{value}</div>
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ 
              width: `${clampedPercentage}%`,
              backgroundColor: getColor()
            }}
          ></div>
        </div>
      </div>
      <div className="progress-footer">
        <small>Target: {target}</small>
        <small className="percentage">{Math.round(clampedPercentage)}%</small>
      </div>
    </div>
  );
}

export default ProgressCard;