import React, { useState } from 'react';
import { Form, Button, Alert, Nav } from 'react-bootstrap';
import axiosInstance from '../../api/axiosInstance';

const AddPlaylistForm = ({ onPlaylistAdded }) => {
  const [formType, setFormType] = useState('url'); // 'url' or 'file'
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [priority, setPriority] = useState(10);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const resetForm = () => {
    setName('');
    setUrl('');
    setPriority(10);
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsCreating(true);

    try {
      // Ensure priority is a valid number before sending
      const parsedPriority = parseInt(priority, 10);
      if (isNaN(parsedPriority)) {
        throw new Error('Please provide a valid number for priority.');
      }

      let response;
      if (formType === 'url') {
        if (!name || !url) { // priority check moved
          throw new Error('Please provide name and URL.');
        }
        response = await axiosInstance.post('/playlists', { name, url, priority: parsedPriority });
      } else {
        if (!name || !file) { // priority check moved
          throw new Error('Please provide name and a file.');
        }
        const formData = new FormData();
        formData.append('name', name);
        formData.append('priority', parsedPriority); // Use parsedPriority
        formData.append('file', file);

        response = await axiosInstance.post('/playlists/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      setSuccess(`Playlist "${name}" created successfully. It will be processed in the background.`);
      resetForm();
      if (onPlaylistAdded) {
        onPlaylistAdded();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create playlist.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mb-4 p-3 bg-light border rounded">
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <Nav variant="tabs" defaultActiveKey="url" onSelect={(k) => setFormType(k)} className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="url">Adicionar por URL</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="file">Adicionar por Arquivo</Nav.Link>
        </Nav.Item>
      </Nav>

      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formPlaylistName">
          <Form.Label>Nome</Form.Label>
          <Form.Control type="text" placeholder="Ex: Fornecedor A" value={name} onChange={(e) => setName(e.target.value)} required />
        </Form.Group>

        {formType === 'url' ? (
          <Form.Group controlId="formPlaylistUrl" className="mt-2">
            <Form.Label>URL M3U</Form.Label>
            <Form.Control type="text" placeholder="http://.../playlist.m3u" value={url} onChange={(e) => setUrl(e.target.value)} required />
          </Form.Group>
        ) : (
          <Form.Group controlId="formPlaylistFile" className="mt-2">
            <Form.Label>Arquivo M3U</Form.Label>
            <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} required />
          </Form.Group>
        )}

        <Form.Group controlId="formPlaylistPriority" className="mt-2">
          <Form.Label>Prioridade</Form.Label>
          <Form.Control
            type="number"
            placeholder="10"
            value={priority}
            onChange={(e) => {
              const value = e.target.value;
              setPriority(value === '' ? '' : parseInt(value, 10));
            }}
            required
          />
          <Form.Text className="text-muted">Prioridade menor (ex: 1) é processada primeiro.</Form.Text>
        </Form.Group>

        <Button variant="primary" type="submit" className="mt-3" disabled={isCreating}>
          {isCreating ? 'Criando...' : 'Adicionar Playlist'}
        </Button>
      </Form>
    </div>
  );
};

export default AddPlaylistForm;
