import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, Card, ListGroup, Badge, Accordion, InputGroup } from 'react-bootstrap';
import axiosInstance from '../../api/axiosInstance';

const VIEW_STATES = {
  INPUT: 'INPUT',
  REVIEW: 'REVIEW',
  LOADING: 'LOADING',
  RESULT: 'RESULT',
};

const AddFromTextModal = ({ show, onHide, onSaveSuccess }) => {
  const [view, setView] = useState(VIEW_STATES.INPUT);
  const [m3uContent, setM3uContent] = useState('');
  const [analysis, setAnalysis] = useState({ newItems: [], duplicateItems: [] });
  const [itemsToSave, setItemsToSave] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [newCategory, setNewCategory] = useState('');
  const [newStreamType, setNewStreamType] = useState('CANAL'); // Novo estado para edição em massa de tipo
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Efeito para inicializar itemsToSave quando a análise é concluída
  useEffect(() => {
    if (view === VIEW_STATES.REVIEW) {
      // Damos a cada item um ID único para a sessão, para o caso de haver URLs duplicadas no input
      setItemsToSave(analysis.newItems.map((item, index) => ({ ...item, uniqueId: index })))
      setSelectedItems(new Set());
      setNewCategory('');
    }
  }, [view, analysis]);

  const handleClose = () => {
    // Reset state on close
    setM3uContent('');
    setAnalysis({ newItems: [], duplicateItems: [] });
    setError(null);
    setResult(null);
    setView(VIEW_STATES.INPUT);
    onHide(); // Propagate close to parent
  };

  const handleAnalyze = async () => {
    setView(VIEW_STATES.LOADING);
    setError(null);
    try {
      const response = await axiosInstance.post('/playlists/analyze', { m3uContent });
      setAnalysis(response.data);
      if (response.data.newItems.length === 0 && response.data.duplicateItems.length === 0) {
        setError("Nenhum stream válido encontrado no conteúdo fornecido.");
        setView(VIEW_STATES.INPUT);
      } else {
        setView(VIEW_STATES.REVIEW);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao analisar o conteúdo M3U.');
      setView(VIEW_STATES.INPUT);
    }
  };

  const handleSave = async () => {
    setView(VIEW_STATES.LOADING);
    setError(null);
    try {
      const response = await axiosInstance.post('/playlists/master/create-from-parsed', { streams: itemsToSave });
      setResult(response.data.message);
      setView(VIEW_STATES.RESULT);
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao salvar os streams.');
      setView(VIEW_STATES.REVIEW); // Volta para a tela de revisão em caso de erro
    }
  };

  const handleSelectionChange = (id, checked) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedItems(newSelection);
  };

  const handleGroupSelection = (ids, checked) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      ids.forEach(id => newSelection.add(id));
    } else {
      ids.forEach(id => newSelection.delete(id));
    }
    setSelectedItems(newSelection);
  };

  const handleApplyCategory = () => {
    if (!newCategory.trim() || selectedItems.size === 0) return;

    const updatedItems = itemsToSave.map(item => {
      if (selectedItems.has(item.uniqueId)) {
        return { ...item, group: { ...(item.group || {}), title: newCategory } };
      }
      return item;
    });
    setItemsToSave(updatedItems);
    setNewCategory('');
    setSelectedItems(new Set());
  };

  const handleApplyStreamType = () => {
    if (!newStreamType || selectedItems.size === 0) return;

    const updatedItems = itemsToSave.map(item => {
      if (selectedItems.has(item.uniqueId)) {
        return { ...item, streamType: newStreamType };
      }
      return item;
    });
    setItemsToSave(updatedItems);
    setNewStreamType('CANAL'); // Reset para o padrão
    setSelectedItems(new Set());
  };

  const renderInputView = () => (
    <>
      <Modal.Header closeButton>
        <Modal.Title>Adicionar Streams em Massa por Texto</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group>
          <Form.Label>Cole o conteúdo M3U abaixo:</Form.Label>
          <Form.Control
            as="textarea"
            rows={15}
            value={m3uContent}
            onChange={(e) => setM3uContent(e.target.value)}
            placeholder="#EXTM3U..."
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleAnalyze} disabled={!m3uContent.trim()}>
          Processar e Revisar
        </Button>
      </Modal.Footer>
    </>
  );

  const renderLoadingView = () => (
    <Modal.Body className="text-center">
      <Spinner animation="border" role="status" className="me-2" />
      <span>Analisando...</span>
    </Modal.Body>
  );

  const renderReviewView = () => {
    const groupedItems = itemsToSave.reduce((acc, item) => {
      const category = item.group?.title || 'Sem Categoria';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    const allIdsInGroup = (group) => (Array.isArray(group) ? group.map(item => item.uniqueId) : []);
    const areAllInGroupSelected = (group) => allIdsInGroup(group).every(id => selectedItems.has(id));

    return (
      <>
        <Modal.Header closeButton>
          <Modal.Title>Revisar e Salvar Streams</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Edição em Massa</Card.Title>
              <InputGroup className="mb-3">
                <Form.Control
                  placeholder="Nome da nova categoria"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <Button 
                  variant="outline-primary"
                  onClick={handleApplyCategory}
                  disabled={selectedItems.size === 0 || !newCategory.trim()}
                >
                  Aplicar a {selectedItems.size} selecionados
                </Button>
              </InputGroup>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Edição em Massa de Tipo</Card.Title>
              <InputGroup className="mb-3">
                <Form.Select
                  value={newStreamType}
                  onChange={(e) => setNewStreamType(e.target.value)}
                >
                  <option value="CANAL">CANAL</option>
                  <option value="FILME">FILME</option>
                  <option value="SERIE">SÉRIE</option>
                </Form.Select>
                <Button 
                  variant="outline-primary"
                  onClick={handleApplyStreamType}
                  disabled={selectedItems.size === 0}
                >
                  Aplicar Tipo a {selectedItems.size} selecionados
                </Button>
              </InputGroup>
            </Card.Body>
          </Card>

          <Accordion defaultActiveKey={['Novos Streams', ...Object.keys(groupedItems)]} alwaysOpen>
            <Accordion.Item eventKey="Novos Streams">
              <Accordion.Header>
                Novos Streams a Serem Adicionados ({itemsToSave.length})
              </Accordion.Header>
              <Accordion.Body>
                {Object.keys(groupedItems).sort().map(category => {
                  const group = groupedItems[category];
                  const allGroupIds = allIdsInGroup(group);
                  const allSelected = areAllInGroupSelected(group);
                  return (
                    <Card key={category} className="mb-2">
                      <Card.Header>
                        <Form.Check 
                          type="checkbox"
                          label={`${category} (${group.length} streams)`}
                          checked={allSelected}
                          onChange={(e) => handleGroupSelection(allGroupIds, e.target.checked)}
                        />
                      </Card.Header>
                      <ListGroup variant="flush">
                        {group.map(item => {
                          if (!item || typeof item !== 'object') return null; // Defesa contra dados malformados
                          return (
                            <ListGroup.Item key={item.uniqueId}>
                              <Form.Check
                                type="checkbox"
                                checked={selectedItems.has(item.uniqueId)}
                                onChange={(e) => handleSelectionChange(item.uniqueId, e.target.checked)}
                                label={String(item.name || 'Sem nome')}
                              />
                              <small className="text-muted d-block ms-4">{item.url}</small>
                              <Badge bg="secondary" className="ms-2">{item.streamType}</Badge>
                            </ListGroup.Item>
                          );
                        })}
                      </ListGroup>
                    </Card>
                  );
                })}
              </Accordion.Body>
            </Accordion.Item>

            {analysis.duplicateItems.length > 0 && (
              <Accordion.Item eventKey="Streams Duplicados">
                <Accordion.Header>
                  Streams Duplicados Ignorados ({analysis.duplicateItems.length})
                </Accordion.Header>
                <Accordion.Body>
                  <ListGroup>
                    {analysis.duplicateItems.map((item, index) => (
                      <ListGroup.Item key={index} variant="light">
                        {item.name || 'Sem nome'}
                        <small className="text-muted d-block">{item.url}</small>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Accordion.Body>
              </Accordion.Item>
            )}
          </Accordion>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setView(VIEW_STATES.INPUT)}>Voltar</Button>
          <Button variant="success" onClick={handleSave} disabled={itemsToSave.length === 0}>
            Salvar {itemsToSave.length} Novos Streams
          </Button>
        </Modal.Footer>
      </>
    );
  };

  const renderResultView = () => (
    <>
      <Modal.Header closeButton>
        <Modal.Title>Operação Concluída</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="success">{result}</Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => { onSaveSuccess(); handleClose(); }}>Fechar</Button>
      </Modal.Footer>
    </>
  );

  const renderContent = () => {
    switch (view) {
      case VIEW_STATES.INPUT:
        return renderInputView();
      case VIEW_STATES.REVIEW:
        return renderReviewView();
      case VIEW_STATES.LOADING:
        return renderLoadingView();
      case VIEW_STATES.RESULT:
        return renderResultView();
      default:
        return renderInputView();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="xl" backdrop="static">
      {renderContent()}
    </Modal>
  );
};

export default AddFromTextModal;
