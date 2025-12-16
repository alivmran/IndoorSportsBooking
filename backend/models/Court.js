const mongoose = require('mongoose');

const courtSchema = mongoose.Schema({
  name: { type: String, required: true }, 
  sportType: { 
    type: String, 
    required: true, 
    enum: ['Padel', 'Futsal', 'Cricket'] 
  }, 
  pricePerHour: { type: Number, required: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Court', courtSchema);