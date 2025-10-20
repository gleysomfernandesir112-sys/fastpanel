import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Alert, InputGroup, Spinner, Modal, Badge } from 'react-bootstrap';
import axiosInstance from '../api/axiosInstance';
import RenewClientModal from './forms/RenewClientModal';

const ClientManager = () => {
  const [clients, setClients] = useState([]);
  const [sourcePlaylists, setSourcePlaylists] = useState([]); // For the creation form
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [expiration, setExpiration] = useState('1');
  const [selectedPlaylists, setSelectedPlaylists] = useState([]);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newClientLink, setNewClientLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchSourcePlaylists();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/clients');
      setClients(response.data);
    } catch {
      setError('Failed to fetch clients. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  const fetchSourcePlaylists = async () => {
    try {
      const response = await axiosInstance.get('/source-playlists');
      setSourcePlaylists(response.data);
    } catch {
      console.error('Failed to fetch source playlists for the form.');
    }
  };

  const handlePlaylistSelectionChange = (playlistId) => {
    setSelectedPlaylists(prev => 
      prev.includes(playlistId) 
        ? prev.filter(id => id !== playlistId) 
        : [...prev, playlistId]
    );
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setNewClientLink(null);

    if (!username || !password || expiration === undefined) {
      setError('Please provide username, password, and expiration.');
      return;
    }
    if (selectedPlaylists.length === 0) {
      setError('Please select at least one playlist for the client.');
      return;
    }

    setIsCreating(true);
    try {
      await axiosInstance.post('/clients', { 
        username, 
        password, 
        expiration, 
        playlistIds: selectedPlaylists 
      });
      
      const serverUrl = axiosInstance.defaults.baseURL.replace('/api', '');
      const fullLink = `${serverUrl}/api/playlists/get.php?username=${username}&password=${password}&type=m3u_plus&output=ts`;
      setNewClientLink(fullLink);
      setSuccess(`Cliente "${username}" criado com sucesso!`);

      // Clear form and refresh list
      setUsername('');
      setPassword('');
      setSelectedPlaylists([]);
      await fetchClients();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create client.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClient = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await axiosInstance.delete(`/clients/${id}`);
        setSuccess('Client deleted successfully.');
        await fetchClients();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete client.');
      }
    }
  };

  // ... (modal handlers remain the same) ...

  return (
    <div>
      {/* ... Alerts ... */}

      <h3 className="mt-4">Create New Client</h3>
      <Form onSubmit={handleCreateClient} className="mb-4">
        {/* Username and Password fields */}
        <Form.Group controlId="formClientUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control type="text" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </Form.Group>
        <Form.Group controlId="formClientPassword" className="mt-2">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Form.Group>

        {/* Playlist Selection */}
        <Form.Group className="mt-3">
          <Form.Label>Source Playlists</Form.Label>
          <div className="mb-3 p-3 border rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {sourcePlaylists.length > 0 ? sourcePlaylists.map(playlist => (
              <Form.Check 
                type="checkbox"
                key={playlist.id}
                id={`playlist-${playlist.id}`}
                label={<>{playlist.name} <Badge bg="secondary">{playlist.streamCount} streams</Badge></>}
                checked={selectedPlaylists.includes(playlist.id)}
                onChange={() => handlePlaylistSelectionChange(playlist.id)}
              />
            )) : <p className="text-muted">No source playlists found. Please add some in the "Gerenciar Playlists" section.</p>}
          </div>
        </Form.Group>

        {/* Expiration */}
        <Form.Group controlId="formClientExpiration" className="mt-2">
          <Form.Label>Subscription Duration</Form.Label>
          <InputGroup>
            <Form.Select value={expiration} onChange={(e) => setExpiration(e.target.value)}>
              <option value="1">1 Month</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">1 Year</option>
              <option value="0">Lifetime</option>
            </Form.Select>
            <InputGroup.Text>from today</InputGroup.Text>
          </InputGroup>
        </Form.Group>

        <Button variant="primary" type="submit" className="mt-3" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Client'}
        </Button>
      </Form>

      {/* ... Existing Clients Table and Modals ... */}
    </div>
  );
};

export default ClientManager;