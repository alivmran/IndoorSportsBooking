const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['match', 'booking', 'general'], default: 'general' },
  isRead: { type: Boolean, default: false },
  link: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
