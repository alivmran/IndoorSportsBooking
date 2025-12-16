const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  court: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Court' },
  date: { type: String, required: true },
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true }, 
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' } 
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);