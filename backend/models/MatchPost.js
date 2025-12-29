const mongoose = require('mongoose');

const matchPostSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  teamName: { type: String, required: true },
  mobile: { type: String, required: true },
  
  // Logic Update
  lookingForPlayers: { type: Boolean, default: false }, // Checkbox
  playersNeeded: { type: Number, default: 0 },          // If checked
  opponentSize: { type: Number, default: 0 },           // If NOT checked (looking for team)
  
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' }
}, { timestamps: true });

module.exports = mongoose.model('MatchPost', matchPostSchema);