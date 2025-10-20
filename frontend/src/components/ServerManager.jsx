import React, { useState, useEffect } from 'react';
import { Button, Table, Alert, Form, Modal, Card, Spinner } from 'react-bootstrap';
import axiosInstance from '../api/axiosInstance';

const ServerManager = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // State for Add/Edit Server Modal
  const [showServerModal, setShowServerModal] = useState(false);
  const [currentServer, setCurrentServer] = useState(null); // Server being edited, null for new
  const [serverName, setServerName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSavingServer, setIsSavingServer] = useState(false);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/servers');
      setServers(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching servers:", err);
      setError('Falha ao carregar servidores. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Server Modal Handlers
  const handleShowServerModal = (server = null) => {
    setCurrentServer(server);
    setServerName(server ? server.name : '');
    setServerUrl(server ? server.url : '');
    setIsDefault(server ? server.isDefault : false);
    setShowServerModal(true);
  };

  const handleCloseServerModal = () => {
    setShowServerModal(false);
    setCurrentServer(null);
    setServerName('');
    setServerUrl('');
    setIsDefault(false);
    setIsSavingServer(false);
  };

  const handleSaveServer = async (e) => {
    e.preventDefault();
    setIsSavingServer(true);
    setError(null);
    setSuccess(null);

    try {
      if (currentServer) {
        // Update existing server
        await axiosInstance.put(`/servers/${currentServer.id}`, { name: serverName, url: serverUrl, isDefault });
        setSuccess('Servidor atualizado com sucesso.');
      } else {
        // Add new server
        await axiosInstance.post('/servers', { name: serverName, url: serverUrl, isDefault });
        setSuccess('Servidor adicionado com sucesso.');
      }
      fetchServers(); // Refresh the list
      handleCloseServerModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao salvar o servidor.');
    } finally {
      setIsSavingServer(false);
    }
  };

  const handleDeleteServer = async (id) => {
    if (window.confirm('Tem certeza que deseja remover este servidor?')) {
      try {
        await axiosInstance.delete(`/servers/${id}`);
        setSuccess('Servidor removido com sucesso.');
        fetchServers(); // Refresh the list
      } catch (err) {
        setError(err.response?.data?.message || 'Falha ao remover o servidor.');
      }
    }
  };

  return (
    <div className="server-manager-dashboard">
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <h3 className="mt-4 mb-4">Gerenciamento de Servidores</h3>

      <Card className="mb-4">
        <Card.Header>Lista de Servidores</Card.Header>
        <Card.Body>
          <Button variant="success" onClick={() => handleShowServerModal()} className="mb-3">
            Adicionar Novo Servidor
          </Button>

          {loading ? (
            <Spinner animation="border" size="sm" className="me-2" />
          ) : servers.length === 0 ? (
            <Alert variant="info">Nenhum servidor cadastrado.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>URL</th>
                  <th>Padrão</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server) => (
                  <tr key={server.id}>
                    <td>{server.id}</td>
                    <td>{server.name}</td>
                    <td>{server.url}</td>
                    <td>{server.isDefault ? 'Sim' : 'Não'}</td>
                    <td>
                      <Button variant="info" size="sm" className="me-2" onClick={() => handleShowServerModal(server)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteServer(server.id)}>Deletar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showServerModal} onHide={handleCloseServerModal}>
        <Modal.Header closeButton>
          <Modal.Title>{currentServer ? 'Editar Servidor' : 'Adicionar Novo Servidor'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSaveServer}>
            <Form.Group className="mb-3">
              <Form.Label>Nome do Servidor</Form.Label>
              <Form.Control
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>URL do Servidor</Form.Label>
              <Form.Control
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Definir como Servidor Padrão"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
            </Form.Group>
            <Button variant="primary" type="submit" disabled={isSavingServer}>
              {isSavingServer ? 'Salvando...' : 'Salvar Servidor'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ServerManager;
