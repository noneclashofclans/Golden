const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true }, 
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  text: { type: String, required: true },
  isAI: { type: Boolean, default: false }, 
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);