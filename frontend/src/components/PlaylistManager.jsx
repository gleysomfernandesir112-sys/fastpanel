import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import axiosInstance from '../api/axiosInstance';
import AddStreamManuallyModal from './forms/AddStreamManuallyModal';
import AddFromTextModal from './forms/AddFromTextModal'; // Import the new modal

const parseExtinf = (extinf) => {
  const attributes = {};
  if (!extinf) return attributes;
  const parts = extinf.split(' ');
  for (const part of parts) {
    if (part.includes('=')) {
      const [key, ...valueParts] = part.split('=');
      const value = valueParts.join('=').replace(/"/g, '');
      attributes[key] = value;
    }
  }
  const nameMatch = extinf.match(/,(.*)/);
  attributes.name = nameMatch ? nameMatch[1] : '';
  return attributes;
};

const getStreamType = (groupTitle) => {
  if (!groupTitle) return 'CANAL';
  const title = groupTitle.toUpperCase();
  if (title.includes('FILME') || title.includes('MOVIE')) return 'FILME';
  if (title.includes('SERIE') || title.includes('SERIES')) return 'SERIE';
  return 'CANAL';
};

const PlaylistManager = () => {
  const [masterPlaylistText, setMasterPlaylistText] = useState('');
  const [streams, setStreams] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [editingStream, setEditingStream] = useState(null); // For editing

  useEffect(() => {
    fetchMasterPlaylistText();
  }, []);

  useEffect(() => {
    // Parse the text into streams whenever it changes
    const lines = masterPlaylistText.split('\n').map(line => line.trim()).filter(line => line);
    const parsedStreams = [];
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i].startsWith('#EXTINF')) {
        const extinf = lines[i];
        const url = lines[i + 1] || '';
        const attributes = parseExtinf(extinf);
        parsedStreams.push({
          id: i,
          extinf,
          url,
          name: attributes['tvg-name'] || attributes.name,
          type: getStreamType(attributes['group-title']),
        });
      }
    }
    setStreams(parsedStreams);
  }, [masterPlaylistText]);

  const fetchMasterPlaylistText = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/playlists/master-text');
      setMasterPlaylistText(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching master playlist text:", err);
      if (err.response) {
        setError(`Failed to fetch master playlist content: ${err.response.status} ${err.response.statusText}`);
      } else {
        setError('Failed to fetch master playlist content. Network error or server is down.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMasterPlaylistText = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await axiosInstance.put('/playlists/master-text', { content: masterPlaylistText });
      setSuccess('Master playlist saved successfully.');
    } catch (err) {
      console.error("Error saving master playlist text:", err);
      if (err.response) {
        setError(`Failed to save master playlist: ${err.response.status} ${err.response.data.message || err.response.statusText}`);
      } else {
        setError('Failed to save master playlist. Network error or server is down.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAppendStream = (newStream) => {
    setMasterPlaylistText(prevText => prevText.trim() + '\n' + newStream);
  };

  const handleEditStream = (stream) => {
    setEditingStream(stream);
    setShowAddStreamModal(true);
  };

  const handleDeleteStream = (streamId) => {
    const newStreams = streams.filter(s => s.id !== streamId);
    const newText = newStreams.map(s => `${s.extinf}\n${s.url}`).join('\n');
    setMasterPlaylistText(newText);
  };
  
  const handleSaveModal = (streamData) => {
    if (editingStream) {
      // Update existing stream
      const newStreams = streams.map(s => {
        if (s.id === editingStream.id) {
          return {
            ...s,
            extinf: streamData.extinf,
            url: streamData.url,
            name: parseExtinf(streamData.extinf).name,
            type: getStreamType(parseExtinf(streamData.extinf)['group-title']),
          };
        }
        return s;
      });
      const newText = newStreams.map(s => `${s.extinf}\n${s.url}`).join('\n');
      setMasterPlaylistText(newText);
    } else {
      // Add new stream
      const newStreamString = `${streamData.extinf}\n${streamData.url}`;
      handleAppendStream(newStreamString);
    }
    setEditingStream(null);
  };

  return (
    <div className="playlist-manager-dashboard">
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <h3 className="mt-4 mb-4">Gerenciamento da Playlist Mestra</h3>

      <div className="mb-3">
        <Button
          variant="primary"
          onClick={handleSaveMasterPlaylistText}
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : 'Salvar Playlist Mestra'}
        </Button>
        <Button
          variant="success"
          onClick={() => { setEditingStream(null); setShowAddStreamModal(true); }}
          className="ms-2"
        >
          Adicionar Stream Manualmente
        </Button>
      </div>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {streams.map(stream => (
              <tr key={stream.id}>
                <td>{stream.name}</td>
                <td><Badge>{stream.type}</Badge></td>
                <td>
                  <Button variant="info" size="sm" onClick={() => handleEditStream(stream)}>Editar</Button>
                  <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDeleteStream(stream.id)}>Remover</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <AddStreamManuallyModal
        show={showAddStreamModal}
        onHide={() => setShowAddStreamModal(false)}
        onSave={handleSaveModal}
        stream={editingStream}
      />
    </div>
  );
};

export default PlaylistManager;