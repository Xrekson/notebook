const express = require('express');
const router = express.Router();
const Note = require('../models/note');

// Create or update a note
router.post('/save', async (req, res) => {
  const { _id, image, title } = req.body;

  try {
    if (_id) {
      // Update existing note
      const updatedNote = await Note.findByIdAndUpdate(
        _id,
        { image, title, updatedAt: new Date() },
        { new: true }
      );
      return res.json({ success: true, updated: true, note: updatedNote });
    } else {
      // Create new note
      const newNote = new Note({ image, title });
      await newNote.save();
      return res.json({ success: true, created: true, note: newNote });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Get all notes
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Delete a note
router.delete('/:id', async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true, deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

module.exports = router;
