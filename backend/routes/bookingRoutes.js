const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { protect, admin, manager } = require('../middleware/authMiddleware');

// @desc    Block a Time Slot (Manual Block)
// @access  Manager (Own Court) or Admin (Any Court)
router.post('/block', protect, manager, async (req, res, next) => {
  try {
    const { courtId, date, startTime, endTime } = req.body;

    // 1. Permission Check: If Manager, ensure they own this court
    if (req.user.role === 'manager') {
        const court = await Court.findById(courtId);
        if (!court || court.manager.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to block this court');
        }
    }

    // 2. Check for Conflicts (Approved or ManualBlock)
    const existingApproved = await Booking.findOne({
      court: courtId,
      date: date,
      startTime: startTime,
      status: { $ne: 'Rejected' } // Check anything NOT rejected (Pending/Approved)
    });

    if (existingApproved) {
      res.status(400);
      throw new Error('Slot already occupied.');
    }

    // 3. Create Block
    const booking = new Booking({
      user: req.user._id, 
      court: courtId,
      date,
      startTime,
      endTime,
      status: 'Approved',
      type: 'ManualBlock', // Important for Analytics
      totalPrice: 0 // Blocks have no revenue
    });

    await booking.save();
    res.status(201).json({ message: 'Time slot blocked successfully' });

  } catch (error) {
    next(error);
  }
});

// @desc    Get Unavailable Slots
// @access  Public/User
router.get('/availability', async (req, res, next) => {
  try {
      const { courtId, date } = req.query;
      if (!courtId || !date) return res.json([]);
      
      const bookings = await Booking.find({
          court: courtId,
          date: date,
          status: { $ne: 'Rejected' }
      });
      
      let unavailable = [];
      bookings.forEach(b => {
          // Add individual hourly slots between startTime and endTime
          const startHour = parseInt(b.startTime.split(':')[0]);
          const endHour = parseInt(b.endTime.split(':')[0]);
          for(let i=startHour; i<endHour; i++) {
              const start = i.toString().padStart(2, '0') + ':00';
              const end = (i+1).toString().padStart(2, '0') + ':00';
              unavailable.push(`${start}-${end}`);
          }
      });
      
      res.json([...new Set(unavailable)]);
  } catch (error) {
      next(error);
  }
});

// @desc    Create Online Booking
// @access  User
router.post('/', protect, async (req, res, next) => {
  try {
    const { courtId, date, timeBlocks, totalPrice } = req.body;
    
    if (!timeBlocks || timeBlocks.length === 0) {
      res.status(400); throw new Error('No time slots provided.');
    }

    const pendingCount = await Booking.countDocuments({ user: req.user._id, status: 'Pending' });
    if (pendingCount + timeBlocks.length > 3) {
        res.status(400); throw new Error('You can only have up to 3 pending booking slots at a time. Please wait for approval or cancel a pending request.');
    }

    const createdBookings = [];
    const pricePerBlock = totalPrice / timeBlocks.length;

    for (let block of timeBlocks) {
      const { startTime, endTime } = block;

      // Check conflicts (Approved or Pending or ManualBlock)
      const existingApproved = await Booking.findOne({
        court: courtId,
        date: date,
        status: { $ne: 'Rejected' },
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ]
      });

      if (existingApproved) {
        res.status(400); throw new Error(`Slot ${startTime}-${endTime} is not available.`);
      }

      const booking = new Booking({
        user: req.user._id,
        court: courtId,
        date,
        startTime,
        endTime,
        status: 'Pending',
        type: 'Online',
        totalPrice: pricePerBlock || 0
      });

      await booking.save();
      createdBookings.push(booking);
    }

    res.status(201).json(createdBookings);
  } catch (error) {
    next(error);
  }
});

// @desc    Get MY Bookings
// @access  User
router.get('/mybookings', protect, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
        .populate('court', 'name sportType location')
        .sort({ date: -1 }); // Newest first
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// @desc    Update Booking (Reschedule)
// @access  User
router.put('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if(booking){
        if(booking.user.toString() !== req.user._id.toString()){
            res.status(401); throw new Error('Not authorized');
        }

        const newDate = req.body.date || booking.date;
        const newStart = req.body.startTime || booking.startTime;

        // FIXED: Check conflict for the NEW time
        const conflict = await Booking.findOne({
            court: booking.court,
            date: newDate,
            startTime: newStart,
            status: { $ne: 'Rejected' },
            _id: { $ne: booking._id } // Exclude self
        });

        if(conflict) {
            res.status(400); throw new Error('New slot is already taken');
        }

        booking.date = newDate;
        booking.startTime = newStart;
        booking.endTime = req.body.endTime || booking.endTime;
        booking.status = 'Pending'; // Reset to pending if changed
        
        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } else {
        res.status(404); throw new Error('Booking not found');
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Get ALL Bookings (For Admin & Manager Tables)
// @access  Manager or Admin
router.get('/all', protect, manager, async (req, res, next) => {
  try {
    let query = {};

    // IF MANAGER: Only show bookings for their court
    if (req.user.role === 'manager') {
        const myCourt = await Court.findOne({ manager: req.user._id });
        if (!myCourt) return res.json([]); // No court assigned
        query = { court: myCourt._id };
    }
    // IF ADMIN: query remains empty {} -> returns all

    const bookings = await Booking.find(query)
        .populate('user', 'name email')
        .populate('court', 'name')
        .sort({ date: -1 });
        
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// @desc    Delete/Cancel Booking
// @access  User (Own), Manager (Own Court), Admin (Any)
router.delete('/:id', protect, async (req, res, next) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if(!booking) { res.status(404); throw new Error('Booking not found'); }

      let authorized = false;

      // 1. User owns it
      if (booking.user && booking.user.toString() === req.user._id.toString()) authorized = true;
      // 2. Admin
      if (req.user.role === 'admin') authorized = true;
      // 3. Manager owns the court
      if (req.user.role === 'manager') {
          const court = await Court.findById(booking.court);
          if (court && court.manager.toString() === req.user._id.toString()) authorized = true;
      }

      if (!authorized) {
          res.status(401); throw new Error('Not authorized');
      }

      await Booking.deleteOne({ _id: req.params.id });
      res.json({ message: 'Booking removed' });

    } catch (error) {
      next(error);
    }
});

// @desc    Approve/Reject Booking
// @access  Manager (Own Court) or Admin
router.patch('/:id/status', protect, manager, async (req, res, next) => {
    try {
        const { status } = req.body; 
        const booking = await Booking.findById(req.params.id);

        if(!booking) { res.status(404); throw new Error('Booking not found'); }

        // Manager Check
        if (req.user.role === 'manager') {
            const court = await Court.findById(booking.court);
            if (!court || court.manager.toString() !== req.user._id.toString()) {
                res.status(401); throw new Error('Not authorized for this court');
            }
        }

        if(status === 'Approved') {
            const conflict = await Booking.findOne({
                court: booking.court,
                date: booking.date,
                startTime: booking.startTime,
                status: 'Approved', // Only check against actually approved slots
                _id: { $ne: booking._id }
            });
            
            if(conflict) {
                res.status(400);
                throw new Error('Cannot approve. Slot already taken.');
            }
        }

        booking.status = status;
        const updatedBooking = await booking.save();
        res.json(updatedBooking);

    } catch (error) {
        next(error);
    }
});

module.exports = router;