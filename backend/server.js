const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // to handle base64

mongoose.connect('mongodb://localhost:27017/notebook', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"));

const notesRouter = require('./routes/noteR');
app.use('/api/notes', notesRouter);

app.listen(5000, () => console.log("Server running on port 5000"));
