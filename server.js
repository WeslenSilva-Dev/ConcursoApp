require('dotenv').config();
const connectDB = require('./src/config/database');
const createApp = require('./src/app');

connectDB();

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\nConcursoApp rodando em http://localhost:${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
