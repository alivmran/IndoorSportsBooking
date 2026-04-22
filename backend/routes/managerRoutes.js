const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { protect, manager } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, manager, async (req, res, next) => {
  try {
    const court = await Court.findOne({ manager: req.user._id });
    if (!court) return res.status(404).json({ message: 'No court assigned' });

    const bookings = await Booking.find({ court: court._id }).populate('user', 'name email').sort({ date: -1 });

    // Stats Calculation
    const totalBookings = bookings.length;
    const approvedBookings = bookings.filter(b => b.status === 'Approved' && b.type === 'Online');
    const totalRevenue = approvedBookings.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
    const pendingRequests = bookings.filter(b => b.status === 'Pending').length;

    res.json({
      courtName: court.name,
      stats: { totalBookings, activeBookings: approvedBookings.length, pendingRequests, totalRevenue },
      recentActivity: bookings.slice(0, 10) // Top 10 recent
    });
  } catch (error) {
    next(error);
  }
});
router.post('/block', protect, manager, async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;
    const court = await Court.findOne({ manager: req.user._id });
    if (!court) return res.status(404).json({ message: 'No court assigned' });

    const conflict = await Booking.findOne({
      court: court._id,
      date,
      status: 'Approved',
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });
    if (conflict) return res.status(400).json({ message: 'Time slot is already booked' });

    const newBlock = new Booking({
      court: court._id,
      date,
      startTime,
      endTime,
      status: 'Approved',
      type: 'ManualBlock'
    });
    await newBlock.save();
    res.status(201).json(newBlock);
  } catch (error) {
    next(error);
  }
});

router.put('/booking/:id', protect, manager, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const court = await Court.findOne({ manager: req.user._id });
    if (!court) return res.status(404).json({ message: 'No court assigned' });

    const booking = await Booking.findOne({ _id: req.params.id, court: court._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

module.exports = router;