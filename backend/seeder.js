const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Court = require('./models/Court');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for Seeding...'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

const courts = [
  { 
    name: 'Legends Arena', 
    sportType: 'Padel', 
    pricePerHour: 7500, 
    priceWeekend: 8500,
    location: 'DHA Phase 5, Karachi',
    description: 'Premier glass-walled padel courts with top-tier lighting and coaching facilities.',
    amenities: ['Showers', 'Cafe', 'Pro Shop', 'Parking']
  },
  { 
    name: 'Smash X', 
    sportType: 'Padel', 
    pricePerHour: 6000, 
    priceWeekend: 7000,
    location: 'DHA Phase 8 & KDA Scheme 1',
    description: 'High-energy padel courts perfect for competitive matches.',
    amenities: ['Floodlights', 'Equipment Rental', 'Parking']
  },
  { 
    name: 'Total Football', 
    sportType: 'Futsal', 
    pricePerHour: 4500, 
    priceWeekend: 5000,
    location: 'North Nazimabad, Karachi',
    description: 'Standard 5-a-side turf with high-quality synthetic grass.',
    amenities: ['Changing Rooms', 'Water', 'Floodlights']
  },
  { 
    name: 'Karachi United Stadium', 
    sportType: 'Futsal', 
    pricePerHour: 5000, 
    priceWeekend: 6000,
    location: 'Clifton, Karachi',
    description: 'Professional grade football facility with multiple pitch options.',
    amenities: ['Academy', 'Stand Seating', 'Parking']
  },
  { 
    name: 'Pavilion End Club', 
    sportType: 'Cricket', 
    pricePerHour: 3500, 
    priceWeekend: 4500,
    location: 'Gulshan-e-Iqbal, Karachi',
    description: 'Huge cricket ground suitable for hard ball and tape ball matches.',
    amenities: ['Member Lounge', 'Food Court', 'Family Area']
  },
  { 
    name: 'Naya Nazimabad Gymkhana', 
    sportType: 'Cricket', 
    pricePerHour: 8000, 
    priceWeekend: 10000,
    location: 'Naya Nazimabad, Karachi',
    description: 'International standard cricket stadium with day/night facilities.',
    amenities: ['Dressing Rooms', 'VIP Stand', 'Floodlights']
  },
  { 
    name: 'Moin Khan Academy', 
    sportType: 'Cricket', 
    pricePerHour: 7000, 
    priceWeekend: 9000,
    location: 'DHA Phase 8, Karachi',
    description: 'Professional academy ground with excellent pitch maintenance.',
    amenities: ['Coaching', 'Floodlights', 'Secure Parking']
  },
  { 
    name: 'Ignite Sports Pavilion', 
    sportType: 'Futsal', 
    pricePerHour: 5500, 
    priceWeekend: 6500,
    location: 'DHA Phase 6, Karachi',
    description: 'Modern rooftop futsal arena with a great view.',
    amenities: ['Cafe', 'Lockers', 'Shower']
  },
  { 
    name: 'KPI Ground', 
    sportType: 'Cricket', 
    pricePerHour: 3000, 
    priceWeekend: 4000,
    location: 'Saddar, Karachi',
    description: 'Historic cricket ground in the heart of the city.',
    amenities: ['Pavilion', 'Seating', 'Canteen']
  },
  { 
    name: 'Dreamworld Resort', 
    sportType: 'Padel', 
    pricePerHour: 5000, 
    priceWeekend: 6000,
    location: 'Gulshan-e-Maymar, Karachi',
    description: 'Resort-style sports facilities with family entertainment nearby.',
    amenities: ['Resort Access', 'Pool', 'Restaurants']
  }
];

const importData = async () => {
  try {
    await Court.deleteMany();
    await Court.insertMany(courts);
    console.log('Real Karachi Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();