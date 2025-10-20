import React, { useState, useEffect } from 'react';
import { Row, Col, Container, Card, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import StatsCard from './StatsCard'; // Import the new component

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/dashboard/stats');
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cardStyle = {
    textDecoration: 'none',
    color: 'inherit',
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3">Dashboard</h1>
          <p className="mb-0 text-muted">Welcome to your control panel.</p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Stats Cards Row */}
      <Row className="mb-4">
        <Col md={6} xl={3} className="mb-4">
          <StatsCard 
            title="Canais ao Vivo" 
            value={stats?.contentCounts?.liveChannels} 
            color="primary" 
            loading={loading}
          />
        </Col>
        <Col md={6} xl={3} className="mb-4">
          <StatsCard 
            title="Filmes" 
            value={stats?.contentCounts?.movies} 
            color="success" 
            loading={loading}
          />
        </Col>
        <Col md={6} xl={3} className="mb-4">
          <StatsCard 
            title="Séries" 
            value={stats?.contentCounts?.series} 
            color="info" 
            loading={loading}
          />
        </Col>
        <Col md={6} xl={3} className="mb-4">
          <StatsCard 
            title="Total Clientes" 
            value={stats?.totalClients} 
            color="warning" 
            loading={loading}
          />
        </Col>
      </Row>

      {/* Navigation Cards Row */}
      <Row>
        <Col md={6} xl={3} className="mb-4">
          <Link to="/clients" style={cardStyle}>
            <Card className="h-100 shadow-sm card-hover">
              <Card.Body>
                <div className="h5 font-weight-bold">Gerenciar Clientes</div>
                <p className="text-muted">Add, remove, and edit clients.</p>
              </Card.Body>
            </Card>
          </Link>
        </Col>
        <Col md={6} xl={3} className="mb-4">
          <Link to="/playlists" style={cardStyle}>
            <Card className="h-100 shadow-sm card-hover">
              <Card.Body>
                <div className="h5 font-weight-bold">Playlists de Origem</div>
                <p className="text-muted">Manage your M3U source files.</p>
              </Card.Body>
            </Card>
          </Link>
        </Col>
        <Col md={6} xl={3} className="mb-4">
          <Link to="/resellers" style={cardStyle}>
            <Card className="h-100 shadow-sm card-hover">
              <Card.Body>
                <div className="h5 font-weight-bold">Revendedores</div>
                <p className="text-muted">Manage your resellers.</p>
              </Card.Body>
            </Card>
          </Link>
        </Col>
        <Col md={6} xl={3} className="mb-4">
          <Link to="/servers" style={cardStyle}>
            <Card className="h-100 shadow-sm card-hover">
              <Card.Body>
                <div className="h5 font-weight-bold">Servidores</div>
                <p className="text-muted">Configure streaming servers.</p>
              </Card.Body>
            </Card>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
