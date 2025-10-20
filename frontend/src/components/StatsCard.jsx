import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
import './StatsCard.css';

const StatsCard = ({ title, value, icon, color, loading }) => {
  return (
    <Card className={`stats-card border-left-${color} shadow-sm h-100`}>
      <Card.Body>
        <div className="row no-gutters align-items-center">
          <div className="col mr-2">
            <div className={`text-xs font-weight-bold text-${color} text-uppercase mb-1`}>
              {title}
            </div>
            <div className="h5 mb-0 font-weight-bold">
              {loading ? <Spinner animation="border" size="sm" /> : value}
            </div>
          </div>
          {icon && (
            <div className="col-auto">
              <i className={`fas ${icon} fa-2x text-gray-300`}></i>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatsCard;
