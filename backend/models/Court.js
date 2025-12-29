const mongoose = require('mongoose');

const courtSchema = mongoose.Schema({
  name: { type: String, required: true }, 
  sportType: { 
    type: String, 
    required: true, 
    enum: ['Padel', 'Futsal', 'Cricket'] 
  }, 
  location: { type: String, default: 'Karachi, Pakistan' }, // New
  googleMapLink: { type: String }, // New
  pricePerHour: { type: Number, required: true }, // Weekday Price
  priceWeekend: { type: Number }, // New: Weekend Price
  description: { type: String },
  images: [{ type: String }], 
  amenities: [{ type: String }], 
}, { timestamps: true });

module.exports = mongoose.model('Court', courtSchema);