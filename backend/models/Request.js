const mongoose = require('mongoose');

const requestSchema = mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  matchPost: { type: mongoose.Schema.Types.ObjectId, ref: 'MatchPost' }, 
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, 
  type: { type: String, enum: ['CHALLENGE', 'JOIN'], required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);