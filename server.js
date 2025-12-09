const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const apiRoutes = require('./routes/api.js');
app.use('/api', apiRoutes);

// Exportar app ANTES de escuchar
module.exports = app;

// Iniciar servidor solo si es el archivo principal
if (!module.parent) {
  const PORT = process.env.PORT || 3000;
  const listener = app.listen(PORT, () => {
    console.log('Your app is listening on port ' + listener.address().port);
  });
}