const mongoose = require('mongoose');

const teamSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sportType: { type: String, enum: ['Padel', 'Futsal', 'Cricket'], required: true },
  memberCount: { type: Number, default: 1 }, // Changed from Array to Number
  lookingForMatch: { type: Boolean, default: false }, 
  description: { type: String },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);