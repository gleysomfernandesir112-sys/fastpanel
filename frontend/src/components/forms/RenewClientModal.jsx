import React, { useState } from 'react';
import { Modal, Button, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import axiosInstance from '../../api/axiosInstance';

const RenewClientModal = ({ show, onHide, client, onRenewSuccess }) => {
  const [expiration, setExpiration] = useState('1'); // Default to 1 month
  const [isRenewing, setIsRenewing] = useState(false);
  const [error, setError] = useState(null);

  const handleRenew = async () => {
    if (!client) return;

    setIsRenewing(true);
    setError(null);

    try {
      await axiosInstance.put(`/clients/${client.id}/renew`, { expiration });
      onRenewSuccess(client.username);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to renew client subscription.');
    } finally {
      setIsRenewing(false);
    }
  };

  // Reset state when the modal is hidden
  const handleOnHide = () => {
    setError(null);
    setExpiration('1');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleOnHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Renew Subscription for <strong>{client?.username}</strong></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group controlId="formClientExpiration">
          <Form.Label>Renewal Duration</Form.Label>
          <InputGroup>
            <Form.Select value={expiration} onChange={(e) => setExpiration(e.target.value)} autoFocus>
              <option value="1">1 Month</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">1 Year</option>
              <option value="0">Lifetime</option>
            </Form.Select>
            <InputGroup.Text>from expiration date</InputGroup.Text>
          </InputGroup>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleOnHide}>Cancel</Button>
        <Button variant="primary" onClick={handleRenew} disabled={isRenewing}>
          {isRenewing ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Renewing...</span>
            </>
          ) : (
            'Confirm Renewal'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RenewClientModal;
