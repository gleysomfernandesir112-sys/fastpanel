import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert, Card, Modal } from 'react-bootstrap';
import axiosInstance from '../api/axiosInstance';

const MasterResellerManager = () => {
  const [resellers, setResellers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    fetchMasterResellers();
  }, []);

  const fetchMasterResellers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/users', { params: { role: 'MASTER_RESELLER' } });
      setResellers(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch master resellers.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await axiosInstance.post('/tokens/generate', { role: 'MASTER_RESELLER' });
      setGeneratedLink(response.data.registrationLink);
      setSuccess(response.data.message);
      setShowModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate registration link.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteMasterReseller = async (id) => {
    if (window.confirm('Are you sure you want to delete this master reseller? This will also delete all their sub-resellers and clients.')) {
      try {
        await axiosInstance.delete(`/users/${id}`);
        setSuccess('Master Reseller deleted successfully.');
        await fetchMasterResellers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete master reseller.');
      }
    }
  };

  const handleCloseModal = () => setShowModal(false);

  return (
    <div>
      <h1 className="h3 mb-4 text-gray-800">Gerenciar Revendedores Master</h1>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && !showModal && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <Card className="mb-4">
        <Card.Header>Adicionar Novo Revendedor Master</Card.Header>
        <Card.Body>
          <p>Gere um link de cadastro único para que um novo revendedor master possa se registrar.</p>
          <Button variant="primary" onClick={handleGenerateLink} disabled={isGenerating}>
            {isGenerating ? 'Gerando...' : 'Gerar Link de Cadastro'}
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Revendedores Master Existentes</Card.Header>
        <Card.Body>
          {loading ? (
            <p>Carregando revendedores master...</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {resellers.map((reseller) => (
                  <tr key={reseller.id}>
                    <td>{reseller.username}</td>
                    <td>{reseller.email}</td>
                    <td>{new Date(reseller.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteMasterReseller(reseller.id)}>
                        Deletar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Link de Cadastro Gerado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Envie o link abaixo para o novo revendedor master. O link é válido por 24 horas.</p>
          <Form.Control type="text" value={generatedLink} readOnly />
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => navigator.clipboard.writeText(generatedLink)}>
            Copiar Link
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MasterResellerManager;
