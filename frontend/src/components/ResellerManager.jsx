import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert, Card, Modal } from 'react-bootstrap';
import axiosInstance from '../api/axiosInstance';

const ResellerManager = () => {
  const [resellers, setResellers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    fetchResellers();
  }, []);

  const fetchResellers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/users', { params: { role: 'RESELLER' } });
      setResellers(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch resellers.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await axiosInstance.post('/tokens/generate', { role: 'RESELLER' });
      setGeneratedLink(response.data.registrationLink);
      setSuccess(response.data.message);
      setShowModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate registration link.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteReseller = async (id) => {
    if (window.confirm('Are you sure you want to delete this reseller? This action cannot be undone.')) {
      try {
        await axiosInstance.delete(`/users/${id}`);
        setSuccess('Reseller deleted successfully.');
        await fetchResellers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete reseller.');
      }
    }
  };

  const handleCloseModal = () => setShowModal(false);

  return (
    <div>
      <h1 className="h3 mb-4 text-gray-800">Gerenciar Revendedores</h1>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && !showModal && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <Card className="mb-4">
        <Card.Header>Adicionar Novo Revendedor</Card.Header>
        <Card.Body>
          <p>Gere um link de cadastro único para que um novo revendedor possa se registrar.</p>
          <Button variant="primary" onClick={handleGenerateLink} disabled={isGenerating}>
            {isGenerating ? 'Gerando...' : 'Gerar Link de Cadastro'}
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Revendedores Existentes</Card.Header>
        <Card.Body>
          {loading ? (
            <p>Carregando revendedores...</p>
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
                      <Button variant="danger" size="sm" onClick={() => handleDeleteReseller(reseller.id)}>
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
          <p>Envie o link abaixo para o novo revendedor. O link é válido por 24 horas.</p>
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

export default ResellerManager;