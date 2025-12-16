const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res, next) => {
  try {
    const { courtId, date, startTime, endTime } = req.body;
    
    const existingApproved = await Booking.findOne({
      court: courtId,
      date: date,
      startTime: startTime,
      status: 'Approved'
    });

    if (existingApproved) {
      res.status(400);
      throw new Error('Slot already booked and approved.');
    }

    const booking = new Booking({
      user: req.user._id,
      court: courtId,
      date,
      startTime,
      endTime,
      status: 'Pending'
    });

    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
  } catch (error) {
    next(error);
  }
});

router.get('/mybookings', protect, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('court', 'name sportType');
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if(booking){
        if(booking.user.toString() !== req.user._id.toString()){
            res.status(401);
            throw new Error('Not authorized');
        }
        booking.date = req.body.date || booking.date;
        booking.startTime = req.body.startTime || booking.startTime;
        booking.endTime = req.body.endTime || booking.endTime;
        booking.status = 'Pending'; 
        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } else {
        res.status(404);
        throw new Error('Booking not found');
    }
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if(booking){
          if(booking.user.toString() !== req.user._id.toString() && !req.user.isAdmin){
              res.status(401);
              throw new Error('Not authorized');
          }
          await Booking.deleteOne({ _id: req.params.id });
          res.json({ message: 'Booking removed' });
      } else {
          res.status(404);
          throw new Error('Booking not found');
      }
    } catch (error) {
      next(error);
    }
  });

router.get('/', protect, admin, async (req, res, next) => {
  try {
    const bookings = await Booking.find({}).populate('user', 'name email').populate('court', 'name');
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', protect, admin, async (req, res, next) => {
    try {
        const { status } = req.body; 
        const booking = await Booking.findById(req.params.id);

        if(!booking) {
            res.status(404);
            throw new Error('Booking not found');
        }

        if(status === 'Approved') {
            const conflict = await Booking.findOne({
                court: booking.court,
                date: booking.date,
                startTime: booking.startTime,
                status: 'Approved',
                _id: { $ne: booking._id }
            });
            
            if(conflict) {
                res.status(400);
                throw new Error('Cannot approve. Slot already taken by another approved booking.');
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