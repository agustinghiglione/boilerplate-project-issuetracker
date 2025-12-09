const chai = require('chai');
const chaiHttp = require('chai-http');
// Importar la app de Express
const app = require('../server'); // ← ESTO ES CORRECTO

chai.use(chaiHttp);
const assert = chai.assert;

suite('Functional Tests', function () {
  const project = 'test-project';
  let createdIssueId = '';

  // 1. Create an issue with every field
  test('Create an issue with every field: POST request to /api/issues/{project}', function (done) {
    const issueData = {
      issue_title: 'Bug in login',
      issue_text: 'The login button does not work on mobile devices',
      created_by: 'John Doe',
      assigned_to: 'Jane Smith',
      status_text: 'In progress'
    };

    chai
      .request(app) // ← CAMBIAR server por app
      .post(`/api/issues/${project}`)
      .send(issueData)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, '_id');
        assert.property(res.body, 'issue_title');
        assert.property(res.body, 'issue_text');
        assert.property(res.body, 'created_by');
        assert.property(res.body, 'assigned_to');
        assert.property(res.body, 'status_text');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'updated_on');
        assert.property(res.body, 'open');
        assert.strictEqual(res.body.issue_title, issueData.issue_title);
        assert.strictEqual(res.body.issue_text, issueData.issue_text);
        assert.strictEqual(res.body.created_by, issueData.created_by);
        assert.strictEqual(res.body.assigned_to, issueData.assigned_to);
        assert.strictEqual(res.body.status_text, issueData.status_text);
        assert.isTrue(res.body.open);
        createdIssueId = res.body._id;
        done();
      });
  });

  // 2. Create an issue with only required fields
  test('Create an issue with only required fields: POST request to /api/issues/{project}', function (done) {
    const issueData = {
      issue_title: 'Feature request',
      issue_text: 'Add dark mode',
      created_by: 'Alice'
    };

    chai
      .request(app) // ← CAMBIAR server por app
      .post(`/api/issues/${project}`)
      .send(issueData)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.strictEqual(res.body.issue_title, issueData.issue_title);
        assert.strictEqual(res.body.issue_text, issueData.issue_text);
        assert.strictEqual(res.body.created_by, issueData.created_by);
        assert.strictEqual(res.body.assigned_to, '');
        assert.strictEqual(res.body.status_text, '');
        done();
      });
  });

  // 3. Create an issue with missing required fields
  test('Create an issue with missing required fields: POST request to /api/issues/{project}', function (done) {
    const issueData = {
      issue_title: 'Incomplete issue'
      // Missing issue_text and created_by
    };

    chai
      .request(app) // ← CAMBIAR server por app
      .post(`/api/issues/${project}`)
      .send(issueData)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, 'error');
        assert.strictEqual(res.body.error, 'required field(s) missing');
        done();
      });
  });

  // 4. View issues on a project
  test('View issues on a project: GET request to /api/issues/{project}', function (done) {
    chai
      .request(app) // ← CAMBIAR server por app
      .get(`/api/issues/${project}`)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 2);
        done();
      });
  });

  // 5. View issues with one filter
  test('View issues on a project with one filter: GET request to /api/issues/{project}', function (done) {
    chai
      .request(app) // ← CAMBIAR server por app
      .get(`/api/issues/${project}?open=true`)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => {
          assert.isTrue(issue.open);
        });
        done();
      });
  });

  // 6. View issues with multiple filters
  test('View issues on a project with multiple filters: GET request to /api/issues/{project}', function (done) {
    chai
      .request(app) // ← CAMBIAR server por app
      .get(`/api/issues/${project}?open=true&created_by=John Doe`)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => {
          assert.isTrue(issue.open);
          assert.strictEqual(issue.created_by, 'John Doe');
        });
        done();
      });
  });

  // 7. Update one field on an issue
  test('Update one field on an issue: PUT request to /api/issues/{project}', function (done) {
    const updateData = {
      _id: createdIssueId,
      issue_text: 'Updated issue text'
    };

    chai
      .request(app) // ← CAMBIAR server por app
      .put(`/api/issues/${project}`)
      .send(updateData)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, 'result');
        assert.property(res.body, '_id');
        assert.strictEqual(res.body.result, 'successfully updated');
        assert.strictEqual(res.body._id, createdIssueId);
        done();
      });
  });

  // 8. Update multiple fields on an issue
  test('Update multiple fields on an issue: PUT request to /api/issues/{project}', function (done) {
    const updateData = {
      _id: createdIssueId,
      assigned_to: 'Bob Johnson',
      status_text: 'Fixed',
      open: false
    };

    chai
      .request(app) // ← CAMBIAR server por app
      .put(`/api/issues/${project}`)
      .send(updateData)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.strictEqual(res.body.result, 'successfully updated');
        done();
      });
  });

  // 9. Update an issue with missing _id
  test('Update an issue with missing _id: PUT request to /api/issues/{project}', function (done) {
    const updateData = {
      issue_text: 'No ID provided'
    };

    chai
      .request(app) // ← CAMBIAR server por app
      .put(`/api/issues/${project}`)
      .send(updateData)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'error');
        assert.strictEqual(res.body.error, 'missing _id');
        done();
      });
  });

  // 10. Update an issue with no fields to update
  test('Update an issue with no fields to update: PUT request to /api/issues/{project}', function (done) {
    const updateData = {
      _id: createdIssueId
    };

    chai
      .request(app) // ← CAMBIAR server por app
      .put(`/api/issues/${project}`)
      .send(updateData)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'error');
        assert.strictEqual(res.body.error, 'no update field(s) sent');
        assert.property(res.body, '_id');
        done();
      });
  });

  // 11. Update an issue with invalid _id
  test('Update an issue with invalid _id: PUT request to /api/issues/{project}', function (done) {
    const updateData = {
      _id: 'invalid_id_123',
      issue_text: 'This should fail'
    };

    chai
      .request(app) // ← CAMBIAR server por app
      .put(`/api/issues/${project}`)
      .send(updateData)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'error');
        assert.strictEqual(res.body.error, 'could not update');
        assert.property(res.body, '_id');
        done();
      });
  });

  // 12. Delete an issue
  test('Delete an issue: DELETE request to /api/issues/{project}', function (done) {
    const deleteData = {
      _id: createdIssueId
    };

    chai
      .request(app) // ← CAMBIAR server por app
      .delete(`/api/issues/${project}`)
      .send(deleteData)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'result');
        assert.strictEqual(res.body.result, 'successfully deleted');
        done();
      });
  });

  // 13. Delete an issue with invalid _id
  test('Delete an issue with invalid _id: DELETE request to /api/issues/{project}', function (done) {
    const deleteData = {
      _id: 'invalid_id_456'
    };

    chai
      .request(app) // ← CAMBIAR server por app
      .delete(`/api/issues/${project}`)
      .send(deleteData)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'error');
        assert.strictEqual(res.body.error, 'could not delete');
        done();
      });
  });

  // 14. Delete an issue with missing _id
  test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', function (done) {
    const deleteData = {
      // No _id provided
    };

    chai
      .request(app) // ← CAMBIAR server por app
      .delete(`/api/issues/${project}`)
      .send(deleteData)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'error');
        assert.strictEqual(res.body.error, 'missing _id');
        done();
      });
  });
});