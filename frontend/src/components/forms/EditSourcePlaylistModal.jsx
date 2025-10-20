import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import axiosInstance from '../../api/axiosInstance';

const EditSourcePlaylistModal = ({ show, onHide, playlist, onSaveSuccess }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && playlist) {
      setLoading(true);
      setError(null);
      axiosInstance.get(`/source-playlists/${playlist.id}/content`)
        .then(response => {
          setContent(response.data);
        })
        .catch(err => {
          setError('Failed to load playlist content.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [show, playlist]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await axiosInstance.put(`/source-playlists/${playlist.id}/content`, { content });
      onSaveSuccess();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save content.');
    } finally {
      setSaving(false);
    }
  };

  const handleOnHide = () => {
    // Clear state when modal is hidden
    setContent('');
    setError(null);
    onHide();
  }

  return (
    <Modal show={show} onHide={handleOnHide} size="xl" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Edit Playlist: {playlist?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
            <p>Loading content...</p>
          </div>
        ) : (
          <Form.Control
            as="textarea"
            rows={20}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="#EXTM3U..."
            spellCheck="false"
            style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleOnHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditSourcePlaylistModal;
