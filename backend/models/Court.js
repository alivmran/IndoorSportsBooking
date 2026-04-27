const mongoose = require('mongoose');

const courtSchema = mongoose.Schema({
  name: { type: String, required: true }, 
  facilities: [{
    type: String,
    enum: ['Padel', 'Futsal', 'Cricket']
  }],
  location: { type: String, default: 'Karachi, Pakistan' }, // New
  googleMapLink: { type: String }, // New
  paymentBank: { type: String },
  paymentAccountTitle: { type: String },
  paymentAccountNumber: { type: String },
  advanceRequired: { type: Number, default: 0 },
  operationalStartTime: { type: String, default: '00:00' },
  operationalEndTime: { type: String, default: '24:00' },
  pricePerHour: { type: Number, required: true }, // Weekday Price
  priceWeekend: { type: Number }, // New: Weekend Price
  description: { type: String },
  images: [{ type: String }], 
  amenities: [{ type: String }], 
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

courtSchema.path('facilities').validate(function (value) {
  return Array.isArray(value) && value.length > 0;
}, 'At least one facility is required.');

module.exports = mongoose.model('Court', courtSchema);