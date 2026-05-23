const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, default: 'Untitled Snippet' },
  content: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  roomId: { type: String, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
