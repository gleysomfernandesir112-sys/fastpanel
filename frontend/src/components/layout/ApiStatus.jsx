import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Badge } from 'react-bootstrap';

const ApiStatus = () => {
  const [status, setStatus] = useState({ state: 'checking', message: 'Verificando...' });

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await axiosInstance.get('/health');
        if (response.status === 200 && response.data.status === 'ok') {
          setStatus({ state: 'online', message: 'Online' });
        } else {
          setStatus({ state: 'offline', message: 'Offline' });
        }
      } catch (error) {
        setStatus({ state: 'offline', message: 'Offline' });
      }
    };

    checkApiStatus();
    // Optional: Poll every 60 seconds
    const intervalId = setInterval(checkApiStatus, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const getBadgeVariant = () => {
    switch (status.state) {
      case 'online':
        return 'success';
      case 'offline':
        return 'danger';
      default:
        return 'warning';
    }
  };

  return (
    <div className="d-flex align-items-center">
      <strong>Status da API:</strong>
      <Badge bg={getBadgeVariant()} className="ms-2">
        {status.message}
      </Badge>
    </div>
  );
};

export default ApiStatus;
