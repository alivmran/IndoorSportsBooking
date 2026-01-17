const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { protect, manager } = require('../middleware/authMiddleware');

// @desc    Get Manager Dashboard Stats (Analytics)
// @route   GET /api/manager/dashboard
router.get('/dashboard', protect, manager, async (req, res, next) => {
  try {
    // 1. Find the court managed by this user
    // Assuming 1 Manager = 1 Court for now
    const court = await Court.findOne({ manager: req.user._id });

    if (!court) {
      return res.status(404).json({ message: 'No court assigned to this manager' });
    }

    // 2. Get all bookings for this court
    const bookings = await Booking.find({ court: court._id });

    // 3. Calculate Stats
    const totalBookings = bookings.length;
    
    const approvedBookings = bookings.filter(b => b.status === 'Approved' && b.type === 'Online');
    
    // Calculate Revenue (Sum of totalPrice from Approved bookings)
    // Note: If you haven't stored totalPrice in past bookings, this might be 0 initially.
    const totalRevenue = approvedBookings.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    const pendingRequests = bookings.filter(b => b.status === 'Pending').length;

    // 4. Get Recent Activity (Last 5)
    const recentActivity = await Booking.find({ court: court._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    res.json({
      courtName: court.name,
      stats: {
        totalBookings,
        activeBookings: approvedBookings.length,
        pendingRequests,
        totalRevenue
      },
      recentActivity
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Manual Block (Mark as Taken)
// @route   POST /api/manager/block
router.post('/block', protect, manager, async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;
    
    const court = await Court.findOne({ manager: req.user._id });
    if (!court) {
        res.status(404);
        throw new Error('No court assigned');
    }

    // Check if already booked
    const conflict = await Booking.findOne({
        court: court._id,
        date,
        startTime,
        status: { $ne: 'Rejected' }
    });

    if(conflict) {
        res.status(400);
        throw new Error('Slot already occupied');
    }

    // Create Block
    await Booking.create({
        court: court._id,
        user: req.user._id, // Manager ID
        date,
        startTime,
        endTime,
        status: 'Approved',
        type: 'ManualBlock',
        totalPrice: 0
    });

    res.status(201).json({ message: 'Slot blocked successfully' });

  } catch (error) {
    next(error);
  }
});

module.exports = router;