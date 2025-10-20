import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Container, Alert } from 'react-bootstrap';
import axiosInstance from '../../api/axiosInstance';

const TokenRegister = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [isValid, setIsValid] = useState(null); // null: validating, true: valid, false: invalid
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsValid(false);
      setError('Nenhum token de registro fornecido.');
      return;
    }

    const validateToken = async () => {
      try {
        await axiosInstance.get(`/tokens/validate/${token}`);
        setIsValid(true);
      } catch (err) {
        setIsValid(false);
        setError(err.response?.data?.message || 'Token inválido ou expirado.');
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload = { token, username, email, password, whatsapp };
      await axiosInstance.post('/tokens/register', payload);
      setSuccess('Cadastro realizado com sucesso! Você será redirecionado para a página de login em 5 segundos.');
      setTimeout(() => {
        navigate('/login'); // Assuming a /login route exists
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao registrar. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isValid === null) {
      return <p>Validando token...</p>;
    }

    if (isValid === false) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (success) {
      return <Alert variant="success">{success}</Alert>;
    }

    return (
      <Form onSubmit={handleSubmit}>
        <h3 className="mb-4">Complete seu Cadastro</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3" controlId="username">
          <Form.Label>Nome de Usuário</Form.Label>
          <Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Senha</Form.Label>
          <Form.Control type="password" placeholder="Crie uma senha forte" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3" controlId="whatsapp">
          <Form.Label>WhatsApp (Opcional)</Form.Label>
          <Form.Control type="text" placeholder="+5511999998888" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </Form.Group>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registrando...' : 'Finalizar Cadastro'}
        </Button>
      </Form>
    );
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Row>
        <Col md={12}>
          <Card className="p-4" style={{ width: '400px' }}>
            <Card.Body>
              {renderContent()}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TokenRegister;
