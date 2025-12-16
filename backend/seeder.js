const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Court = require('./models/Court');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

const courts = [
  { name: 'Alpha Arena', sportType: 'Futsal', pricePerHour: 50, description: 'Professional turf' },
  { name: 'Beta Pitch', sportType: 'Cricket', pricePerHour: 40, description: 'Concrete pitch' },
  { name: 'Gamma Court', sportType: 'Padel', pricePerHour: 35, description: 'Indoor glass court' },
  { name: 'Delta Field', sportType: 'Futsal', pricePerHour: 45, description: '5-a-side standard' },
  { name: 'Epsilon Nets', sportType: 'Cricket', pricePerHour: 30, description: 'Net practice' },
  { name: 'Zeta Zone', sportType: 'Padel', pricePerHour: 35, description: 'Outdoor court' },
  { name: 'Omega Ground', sportType: 'Futsal', pricePerHour: 60, description: '7-a-side premium' },
  { name: 'Theta Turf', sportType: 'Cricket', pricePerHour: 55, description: 'Night lighting available' },
  { name: 'Sigma Smash', sportType: 'Padel', pricePerHour: 32, description: 'Training court' },
  { name: 'Kappa Court', sportType: 'Futsal', pricePerHour: 40, description: 'Rooftop arena' },
];

const importData = async () => {
  try {
    await Court.deleteMany();
    await Court.insertMany(courts);
    console.log('Data Imported');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

importData();