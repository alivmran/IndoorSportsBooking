const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Court = require('./models/Court');
const Booking = require('./models/Booking');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for Seeding...'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

const importData = async () => {
  try {
    // 1. Check if Super Admin exists, if so, do nothing or update
    const adminEmail = 'syed.ali.imran2005@gmail.com'; // Hardcoded as requested
    const adminPass = process.env.ADMIN_PASSWORD; // Set this in .env!

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
        console.log('Super Admin already exists.');
        existingAdmin.role = 'admin';
        existingAdmin.isAdmin = true;
        await existingAdmin.save();
        console.log('Super Admin privileges refreshed.');
    } else {
        await User.create({
            name: 'Super Admin',
            email: adminEmail,
            password: adminPass,
            role: 'admin',
            isAdmin: true
        });
        console.log(`Super Admin Created: ${adminEmail}`);
    }

    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();