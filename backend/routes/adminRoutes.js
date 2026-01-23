const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Global Admin Data
router.get('/data', protect, admin, async (req, res, next) => {
  try {
    const courts = await Court.find({}).populate('manager', 'name email');
    const managers = await User.find({ role: 'manager' });
    
    const totalBookings = await Booking.countDocuments();
    const totalRevenue = (await Booking.find({ status: 'Approved', type: 'Online' }))
        .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    res.json({ courts, managers, stats: { totalBookings, totalRevenue } });
  } catch (error) { next(error); }
});

// @desc    Create Court & Manager (FIXED)
router.post('/create-court', protect, admin, async (req, res, next) => {
  try {
    const { courtName, location, sportType, pricePerHour, priceWeekend, managerName, managerEmail } = req.body;

    // Check if Email Taken
    const existingUser = await User.findOne({ email: managerEmail });
    if (existingUser) {
        res.status(400);
        throw new Error(`Manager email '${managerEmail}' is already in use.`);
    }

    const password = `${courtName.replace(/\s+/g, '')}123`;

    // Create Manager
    const manager = await User.create({
        name: managerName, email: managerEmail, password, role: 'manager'
    });

    // Create Court
    const court = await Court.create({
        name: courtName, location, sportType, pricePerHour, priceWeekend: priceWeekend || pricePerHour, 
        manager: manager._id, images: []
    });

    manager.managedCourt = court._id;
    await manager.save();

    res.status(201).json({ message: 'Created', court, manager: { email: manager.email, password } });

  } catch (error) {
    // Handle Duplicate Key Error (E11000)
    if (error.code === 11000) {
        res.status(400);
        next(new Error(`Duplicate Data: Email or Court Name already exists.`));
    } else {
        next(error);
    }
  }
});

// @desc    Specific Court Analytics
router.get('/court/:id/stats', protect, admin, async (req, res, next) => {
  try {
    const courtId = req.params.id;
    const court = await Court.findById(courtId);
    if (!court) { res.status(404); throw new Error('Court not found'); }

    const bookings = await Booking.find({ court: courtId }).populate('user', 'name email').sort({ date: -1 });

    const totalRevenue = bookings
        .filter(b => b.status === 'Approved' && b.type === 'Online')
        .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    const activeBookings = bookings.filter(b => b.status === 'Approved').length;
    const canceledBookings = bookings.filter(b => b.status === 'Rejected').length;
    const uniqueUsers = [...new Set(bookings.map(b => b.user?.email).filter(Boolean))].length;

    res.json({
      court,
      stats: { totalRevenue, totalBookings: bookings.length, activeBookings, canceledBookings, uniqueUserCount: uniqueUsers },
      bookings
    });
  } catch (error) { next(error); }
});

// @desc    Update Court
router.put('/court/:id', protect, admin, async (req, res, next) => {
    try {
        const court = await Court.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(court);
    } catch (error) { next(error); }
});

// @desc    Delete Court
router.delete('/court/:id', protect, admin, async (req, res, next) => {
    try {
        const court = await Court.findById(req.params.id);
        if(court && court.manager) await User.findByIdAndDelete(court.manager);
        await Court.deleteOne({ _id: req.params.id });
        res.json({ message: 'Deleted' });
    } catch (error) { next(error); }
});

// @desc    Admin Block Slot
router.post('/block-slot', protect, admin, async (req, res, next) => {
    try {
        const { courtId, date, startTime, endTime } = req.body;
        const conflict = await Booking.findOne({ court: courtId, date, startTime, status: { $ne: 'Rejected' } });
        if(conflict) { res.status(400); throw new Error('Slot occupied'); }
        
        await Booking.create({
            court: courtId, user: req.user._id, date, startTime, endTime,
            status: 'Approved', type: 'ManualBlock', totalPrice: 0
        });
        res.status(201).json({ message: 'Blocked' });
    } catch (error) { next(error); }
});

module.exports = router;