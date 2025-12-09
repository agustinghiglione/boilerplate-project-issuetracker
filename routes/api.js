const express = require('express');
const router = express.Router();

// Almacenamiento en memoria (simula DB)
const issuesDB = {};

// Helper: generar ID único
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// POST /api/issues/:project
router.post('/issues/:project', (req, res) => {
  const project = req.params.project;
  const { issue_title, issue_text, created_by, assigned_to = '', status_text = '' } = req.body;

  // Validar campos requeridos
  if (!issue_title || !issue_text || !created_by) {
    return res.json({ error: 'required field(s) missing' });
  }

  // Inicializar array de issues para el proyecto si no existe
  if (!issuesDB[project]) {
    issuesDB[project] = [];
  }

  const now = new Date();
  const newIssue = {
    _id: generateId(),
    issue_title,
    issue_text,
    created_by,
    assigned_to,
    status_text,
    created_on: now,
    updated_on: now,
    open: true,
  };

  issuesDB[project].push(newIssue);
  res.json(newIssue);
});

// GET /api/issues/:project
router.get('/issues/:project', (req, res) => {
  const project = req.params.project;
  const filters = req.query;

  if (!issuesDB[project]) {
    return res.json([]);
  }

  let filteredIssues = [...issuesDB[project]];

  // Aplicar filtros
  Object.keys(filters).forEach((key) => {
    if (key === 'open') {
      // Convertir string a boolean
      const value = filters[key] === 'true';
      filteredIssues = filteredIssues.filter((issue) => issue[key] === value);
    } else if (key !== '_id') {
      filteredIssues = filteredIssues.filter((issue) =>
        String(issue[key]).toLowerCase().includes(String(filters[key]).toLowerCase())
      );
    }
  });

  res.json(filteredIssues);
});

// PUT /api/issues/:project
router.put('/issues/:project', (req, res) => {
  const project = req.params.project;
  const { _id, ...updateFields } = req.body;

  // Validar _id
  if (!_id) {
    return res.json({ error: 'missing _id' });
  }

  // Validar campos a actualizar
  if (Object.keys(updateFields).length === 0) {
    return res.json({ error: 'no update field(s) sent', '_id': _id });
  }

  // Buscar proyecto y issue
  if (!issuesDB[project]) {
    return res.json({ error: 'could not update', '_id': _id });
  }

  const issueIndex = issuesDB[project].findIndex((issue) => issue._id === _id);
  if (issueIndex === -1) {
    return res.json({ error: 'could not update', '_id': _id });
  }

  // Actualizar campos permitidos
  const allowedFields = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open'];
  let hasValidUpdate = false;

  allowedFields.forEach((field) => {
    if (updateFields[field] !== undefined) {
      issuesDB[project][issueIndex][field] = updateFields[field];
      hasValidUpdate = true;
    }
  });

  if (!hasValidUpdate) {
    return res.json({ error: 'could not update', '_id': _id });
  }

  // Actualizar fecha
  issuesDB[project][issueIndex].updated_on = new Date();

  res.json({ result: 'successfully updated', '_id': _id });
});

// DELETE /api/issues/:project
router.delete('/issues/:project', (req, res) => {
  const project = req.params.project;
  const { _id } = req.body;

  // Validar _id
  if (!_id) {
    return res.json({ error: 'missing _id' });
  }

  // Buscar proyecto
  if (!issuesDB[project]) {
    return res.json({ error: 'could not delete', '_id': _id });
  }

  const issueIndex = issuesDB[project].findIndex((issue) => issue._id === _id);
  if (issueIndex === -1) {
    return res.json({ error: 'could not delete', '_id': _id });
  }

  // Eliminar issue
  issuesDB[project].splice(issueIndex, 1);
  res.json({ result: 'successfully deleted', '_id': _id });
});

module.exports = router;