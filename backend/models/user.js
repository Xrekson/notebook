const mongoose = require('mongoose');
/**
 * Represents a user in the system
 * @typedef {Object} User
 * @property {string} username - The user's username
 * @property {string} email - The user's email
 * @property {string} password - The hashed password
 * @property {Date} createdAt - When the user was created
 */

/**
 * User mongoose schema
 * @type {import('mongoose').Schema<User>}
 */
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
