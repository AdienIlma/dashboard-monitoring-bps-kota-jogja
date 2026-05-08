const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pplRoutes = require('./routes/pplRoutes');
const pmlRoutes = require('./routes/pmlRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ppl', pplRoutes);
app.use('/api/pml', pmlRoutes);

app.get('/', (req, res) => res.json({ message: 'Backend BPS Monitoring OK' }));

// Error handler Express 5
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server jalan di port ${PORT}`));