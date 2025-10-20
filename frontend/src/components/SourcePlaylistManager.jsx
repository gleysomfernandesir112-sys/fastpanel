import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Alert, Spinner, Badge, Container, Row, Col, Card } from 'react-bootstrap';
import axiosInstance from '../api/axiosInstance';
import EditSourcePlaylistModal from './forms/EditSourcePlaylistModal'; // Import the modal

const SourcePlaylistManager = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state for creation
  const [name, setName] = useState('');
  const [type, setType] = useState('LIVE');
  const [content, setContent] = useState(''); // Changed from file to content
  const [isCreating, setIsCreating] = useState(false);

  // State for the edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/source-playlists');
      setPlaylists(response.data);
    } catch (err) {
      setError('Failed to fetch source playlists.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!name || !type || !content) {
      setError('Please provide a name, type, and M3U content.');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      await axiosInstance.post('/source-playlists', { name, type, content });
      setSuccess('Source playlist created successfully!');
      // Reset form and refresh list
      setName('');
      setType('LIVE');
      setContent('');
      fetchPlaylists();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create source playlist.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (window.confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      try {
        await axiosInstance.delete(`/source-playlists/${playlistId}`);
        setSuccess('Playlist deleted successfully.');
        fetchPlaylists();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete playlist.');
      }
    }
  };

  const handleShowEditModal = (playlist) => {
    setSelectedPlaylist(playlist);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setSuccess('Playlist updated successfully!');
    fetchPlaylists(); // Refresh the list to show new stream count
  };

  return (
    <Container fluid>
      <Row>
        <Col>
          <h3 className="mt-4">Gerenciar Playlists de Origem</h3>
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}
        </Col>
      </Row>

      <Row>
        {/* Create Playlist Form */}
        <Col md={5}>
          <Card className="mb-4">
            <Card.Header>Adicionar Nova Playlist por Texto</Card.Header>
            <Card.Body>
              <Form onSubmit={handleCreatePlaylist}>
                <Form.Group className="mb-3" controlId="formPlaylistName">
                  <Form.Label>Nome da Playlist</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ex: Canais SP, Filmes 4K"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPlaylistType">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select value={type} onChange={(e) => setType(e.target.value)} required>
                    <option value="LIVE">TV Ao Vivo</option>
                    <option value="MOVIE">Filmes</option>
                    <option value="SERIES">Séries</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPlaylistContent">
                  <Form.Label>Conteúdo M3U</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={10}
                    placeholder="#EXTM3U..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required 
                  />
                </Form.Group>

                <Button variant="primary" type="submit" disabled={isCreating}>
                  {isCreating ? <Spinner as="span" animation="border" size="sm" /> : 'Criar Playlist'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Playlists Table */}
        <Col md={7}>
          {loading ? (
            <Spinner animation="border" />
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Streams</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {playlists.map((playlist) => (
                  <tr key={playlist.id}>
                    <td>{playlist.name}</td>
                    <td>
                      <Badge bg={playlist.type === 'LIVE' ? 'primary' : playlist.type === 'MOVIE' ? 'success' : 'info'}>
                        {playlist.type}
                      </Badge>
                    </td>
                    <td>{playlist.streamCount}</td>
                    <td>
                      <Button variant="warning" size="sm" className="me-2" onClick={() => handleShowEditModal(playlist)}>
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeletePlaylist(playlist.id)}
                      >
                        Deletar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>

      {/* Edit Modal */}
      {selectedPlaylist && (
        <EditSourcePlaylistModal 
            show={showEditModal}
            onHide={() => setShowEditModal(false)}
            playlist={selectedPlaylist}
            onSaveSuccess={handleEditSuccess}
        />
      )}
    </Container>
  );
};

export default SourcePlaylistManager;
