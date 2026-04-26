const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const { protect, admin } = require('../middleware/authMiddleware');

const parseHour = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return null;
  const [h, m] = timeString.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m) || m !== 0 || h < 0 || h > 24) return null;
  return h;
};

// @desc    Global Admin Data
router.get('/data', protect, admin, async (req, res, next) => {
  try {
    const courts = await Court.find({}).populate('manager', 'name email');
    const managers = await User.find({ role: 'manager' });
    const disputes = await Booking.find({ status: 'Disputed' })
      .populate('user', 'name email')
      .populate({ path: 'court', select: 'name manager', populate: { path: 'manager', select: 'name email' } })
      .sort({ updatedAt: -1 });
    
    const totalBookings = await Booking.countDocuments();
    const totalRevenue = (await Booking.find({ status: 'Approved', type: 'Online' }))
        .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    res.json({ courts, managers, disputes, stats: { totalBookings, totalRevenue, pendingDisputes: disputes.length } });
  } catch (error) { next(error); }
});

// @desc    Create Court & Manager (FIXED)
router.post('/create-court', protect, admin, async (req, res, next) => {
  try {
    const {
      courtName,
      location,
      facilities,
      amenities,
      googleMapLink,
      paymentBank,
      paymentAccountTitle,
      paymentAccountNumber,
      advanceRequired,
      operationalStartTime,
      operationalEndTime,
      pricePerHour,
      priceWeekend,
      managerName,
      managerEmail
    } = req.body;

    const startHour = parseHour(operationalStartTime || '00:00');
    const endHour = parseHour(operationalEndTime || '24:00');
    if (startHour === null || endHour === null || endHour <= startHour) {
      res.status(400);
      throw new Error('Operational hours must be hourly values and end after start.');
    }

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
        name: courtName,
        location,
        facilities,
        amenities,
        googleMapLink,
        paymentBank,
        paymentAccountTitle,
        paymentAccountNumber,
        advanceRequired: advanceRequired || 0,
        operationalStartTime: operationalStartTime || '00:00',
        operationalEndTime: operationalEndTime || '24:00',
        pricePerHour,
        priceWeekend: priceWeekend || pricePerHour, 
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

// @desc    Assign Manager to Existing Court
router.post('/assign-manager', protect, admin, async (req, res, next) => {
  try {
    const { courtId, managerName, managerEmail } = req.body;
    const court = await Court.findById(courtId);
    if (!court) throw new Error('Court not found');
    const existingUser = await User.findOne({ email: managerEmail });
    if (existingUser) throw new Error(`Manager email '${managerEmail}' is already in use.`);
    const password = req.body.password;
    const manager = await User.create({ name: managerName, email: managerEmail, password, role: 'manager', managedCourt: court._id });
    court.manager = manager._id;
    await court.save();
    res.status(201).json({ message: 'Manager Assigned', manager: { email: manager.email, password } });
  } catch(error) {
    if (error.code === 11000) {
        res.status(400);
        next(new Error(`Duplicate Data: Email already exists.`));
    } else {
        next(error);
    }
  }
});

// @desc    Reset Manager Password
// @route   POST /api/admin/reset-manager-password
// @access  Private Admin
router.post('/reset-manager-password', protect, admin, async (req, res, next) => {
  try {
    const { managerId, newPassword } = req.body;
    const manager = await User.findById(managerId);
    if (!manager) throw new Error('Manager not found');
    manager.password = newPassword;
    await manager.save();
    res.json({ message: 'Password updated successfully' });
  } catch(error) {
    next(error);
  }
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
        const { courtId, facility, date, startTime, endTime, timeBlocks } = req.body;
        const court = await Court.findById(courtId);
        if (!court) {
          res.status(404);
          throw new Error('Court not found');
        }
        const blocks = Array.isArray(timeBlocks) && timeBlocks.length > 0
          ? timeBlocks
          : [{ startTime, endTime }];

        for (const block of blocks) {
          const blockStartHour = parseHour(block.startTime);
          const blockEndHour = parseHour(block.endTime);
          const openHour = parseHour(court.operationalStartTime || '00:00');
          const closeHour = parseHour(court.operationalEndTime || '24:00');
          if (blockStartHour === null || blockEndHour === null || blockEndHour <= blockStartHour) {
            res.status(400);
            throw new Error('Invalid time block.');
          }
          if (blockStartHour < openHour || blockEndHour > closeHour) {
            res.status(400);
            throw new Error('Block time is outside operational hours.');
          }
          const conflict = await Booking.findOne({ court: courtId, facility, date, startTime: block.startTime, status: { $ne: 'Rejected' } });
          if(conflict) { res.status(400); throw new Error(`Slot ${block.startTime}-${block.endTime} occupied`); }
          
          await Booking.create({
              court: courtId, facility, user: req.user._id, date, startTime: block.startTime, endTime: block.endTime,
              status: 'Approved', type: 'ManualBlock', totalPrice: 0
          });
        }
        res.status(201).json({ message: 'Blocked' });
    } catch (error) { next(error); }
});

router.put('/disputes/:id/resolve', protect, admin, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error('Dispute booking not found');
    }
    if (booking.status !== 'Disputed') {
      res.status(400);
      throw new Error('This booking is not in disputed state');
    }
    booking.status = 'Refunded';
    await booking.save();
    res.json({ message: 'Dispute marked as resolved.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;