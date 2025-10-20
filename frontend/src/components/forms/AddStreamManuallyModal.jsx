import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

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

const AddStreamManuallyModal = ({ show, onHide, onSave, stream }) => {
  const [tvgId, setTvgId] = useState('');
  const [tvgName, setTvgName] = useState('');
  const [tvgLogo, setTvgLogo] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [streamUrl, setStreamUrl] = useState('');

  useEffect(() => {
    if (stream) {
      const attributes = parseExtinf(stream.extinf);
      setTvgId(attributes['tvg-id'] || '');
      setTvgName(attributes['tvg-name'] || attributes.name || '');
      setTvgLogo(attributes['tvg-logo'] || '');
      setGroupTitle(attributes['group-title'] || '');
      setStreamUrl(stream.url || '');
    } else {
      // Reset form for new stream
      setTvgId('');
      setTvgName('');
      setTvgLogo('');
      setGroupTitle('');
      setStreamUrl('');
    }
  }, [stream]);

  const handleSave = () => {
    const extinfLine = `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${tvgName}" tvg-logo="${tvgLogo}" group-title="${groupTitle}",${tvgName}`;
    onSave({
      extinf: extinfLine,
      url: streamUrl,
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{stream ? 'Editar Stream' : 'Adicionar Stream Manualmente'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>tvg-id</Form.Label>
            <Form.Control type="text" value={tvgId} onChange={(e) => setTvgId(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>tvg-name</Form.Label>
            <Form.Control type="text" value={tvgName} onChange={(e) => setTvgName(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>tvg-logo</Form.Label>
            <Form.Control type="text" value={tvgLogo} onChange={(e) => setTvgLogo(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>group-title</Form.Label>
            <Form.Control type="text" value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>URL do Stream</Form.Label>
            <Form.Control type="text" value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} required />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Salvar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddStreamManuallyModal;