const express = require('express');
const router = express.Router();

const issuesDB = {};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// POST /api/issues/:project
router.post('/issues/:project', (req, res) => {
  const project = req.params.project;
  const { issue_title, issue_text, created_by } = req.body;
  const assigned_to = req.body.assigned_to || '';
  const status_text = req.body.status_text || '';

  if (!issue_title || !issue_text || !created_by) {
    return res.json({ error: 'required field(s) missing' });
  }

  if (!issuesDB[project]) issuesDB[project] = [];

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
    open: true
  };

  issuesDB[project].push(newIssue);
  res.json(newIssue);
});

// GET /api/issues/:project
router.get('/issues/:project', (req, res) => {
  const project = req.params.project;
  const filters = req.query;

  if (!issuesDB[project]) return res.json([]);

  let issues = [...issuesDB[project]];

  Object.keys(filters).forEach(key => {
    if (key === '_id') {
      issues = issues.filter(issue => issue._id === filters[key]);
    } else if (key === 'open') {
      // Manejo EXACTO de booleanos como espera FCC
      if (filters[key] === 'true') {
        issues = issues.filter(issue => issue.open === true);
      } else if (filters[key] === 'false') {
        issues = issues.filter(issue => issue.open === false);
      }
    } else {
      // Filtro exacto (case-insensitive para texto)
      issues = issues.filter(issue => 
        String(issue[key]).toLowerCase() === String(filters[key]).toLowerCase()
      );
    }
  });

  res.json(issues);
});

// PUT /api/issues/:project
router.put('/issues/:project', (req, res) => {
  const project = req.params.project;
  const { _id, ...updateFields } = req.body;

  // 1. Validar _id presente
  if (!_id) {
    return res.json({ error: 'missing _id' });
  }

  // 2. Filtrar campos vacíos o undefined
  const filteredUpdates = {};
  Object.keys(updateFields).forEach(key => {
    if (updateFields[key] !== undefined && updateFields[key] !== '') {
      filteredUpdates[key] = updateFields[key];
    }
  });

  // 3. Si no hay campos válidos después de filtrar
  if (Object.keys(filteredUpdates).length === 0) {
    return res.json({ error: 'no update field(s) sent', '_id': _id });
  }

  // 4. Buscar proyecto e issue
  if (!issuesDB[project]) {
    return res.json({ error: 'could not update', '_id': _id });
  }

  const issueIndex = issuesDB[project].findIndex(issue => issue._id === _id);
  if (issueIndex === -1) {
    return res.json({ error: 'could not update', '_id': _id });
  }

  // 5. Actualizar solo campos permitidos
  const allowedFields = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text', 'open'];
  let updated = false;

  allowedFields.forEach(field => {
    if (filteredUpdates[field] !== undefined) {
      // Manejo especial para campo 'open'
      if (field === 'open') {
        issuesDB[project][issueIndex][field] = (filteredUpdates[field] === true || 
                                               filteredUpdates[field] === 'true');
      } else {
        issuesDB[project][issueIndex][field] = filteredUpdates[field];
      }
      updated = true;
    }
  });

  if (!updated) {
    return res.json({ error: 'could not update', '_id': _id });
  }

  // 6. SIEMPRE actualizar updated_on (incluso si el valor no cambió)
  issuesDB[project][issueIndex].updated_on = new Date();

  // 7. Respuesta EXACTA que espera FCC
  res.json({ result: 'successfully updated', '_id': _id });
});

// DELETE /api/issues/:project
router.delete('/issues/:project', (req, res) => {
  const project = req.params.project;
  const { _id } = req.body;

  if (!_id) {
    return res.json({ error: 'missing _id' });
  }

  if (!issuesDB[project]) {
    return res.json({ error: 'could not delete', '_id': _id });
  }

  const issueIndex = issuesDB[project].findIndex(issue => issue._id === _id);
  if (issueIndex === -1) {
    return res.json({ error: 'could not delete', '_id': _id });
  }

  issuesDB[project].splice(issueIndex, 1);
  res.json({ result: 'successfully deleted', '_id': _id });
});

module.exports = router;