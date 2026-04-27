const mongoose = require('mongoose');

const matchPostSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  adHocTeamName: { type: String, required: true },
  mobile: { type: String, required: true },
  
  mySquadSize: { type: Number, required: true },
  opponentSquadSize: { type: Number, required: true },
  challengerUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attendanceReported: { type: Boolean, default: false },
  
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' }
}, { timestamps: true });

module.exports = mongoose.model('MatchPost', matchPostSchema);