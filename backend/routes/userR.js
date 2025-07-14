const express = require('express');
const router = express.Router();
const User = require('../models/user');

/**
 * @typedef {Object} UserResponse
 * @property {boolean} success - Indicates if the operation was successful
 * @property {boolean} [created] - Present when creating a user, indicates creation success
 * @property {boolean} [updated] - Present when updating a user, indicates update success
 * @property {Object} [user] - The created or updated user object
 * @property {string} [error] - Error message if operation failed
 */

/**
 * @typedef {Object} UserRequest
 * @property {string} [_id] - MongoDB ID for existing user (required for updates)
 * @property {string} username - User's username
 * @property {string} password - User's password (should be hashed)
 * @property {string} [email] - User's email address
 */

/**
 * Creates or updates a user
 * @name POST /users/save
 * @function
 * @memberof module:routes/users
 * @param {UserRequest} req.body - The user data to create or update
 * @returns {UserResponse} Response object with operation status
 */
router.post('/save', async (req, res) => {
  const { _id, username, password, email } = req.body;

  try {
    if (_id) {
      // Update existing user
      const updatedUser = await User.findByIdAndUpdate(
        _id,
        { username, password, email, updatedAt: new Date() },
        { new: true }
      );
      return res.json({ success: true, updated: true, user: updatedUser });
    } else {
      // Create new user
      const newUser = new User({ username, password, email });
      await newUser.save();
      return res.json({ success: true, created: true, user: newUser });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * Gets all users
 * @name GET /users
 * @function
 * @memberof module:routes/users
 * @returns {Promise<Array>} Array of user objects
 * @throws {Object} Error object with failure message
 */
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Users!' });
  }
});

/**
 * @typedef {Object} DeleteResponse
 * @property {boolean} success - Indicates if the operation was successful
 * @property {boolean} deleted - Indicates if deletion was successful
 * @property {string} [error] - Error message if operation failed
 */

/**
 * Deletes a user
 * @name DELETE /users/:id
 * @function
 * @memberof module:routes/users
 * @param {string} id.path.required - The ID of the user to delete
 * @returns {DeleteResponse} Response object with operation status
 */
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

module.exports = router;