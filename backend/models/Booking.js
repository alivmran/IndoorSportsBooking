const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
  court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  type: {
    type: String,
    enum: ['Online', 'ManualBlock'],
    default: 'Online'
  },
  totalPrice: { type: Number } 
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);