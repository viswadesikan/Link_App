const mongoose = require('mongoose');

const LinkFolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  links: [String], // Changed from Object to just String for URLs
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LinkFolder', LinkFolderSchema);