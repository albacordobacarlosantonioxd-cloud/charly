const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  antilink: { type: Boolean, default: false }
});

module.exports = mongoose.models.Group || mongoose.model('Group', groupSchema);