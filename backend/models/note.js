const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  image: String, // base64 or image URL
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);
