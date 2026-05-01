const express = require('express');
const router = express.Router();
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', async (req, res, next) => {
  try {
    if (req.query.all === 'true') {
        const courts = await Court.find({});
        return res.json(courts);
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const facility = req.query.facility || 'All';

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (facility !== 'All') {
      query.facilities = facility;
    }

    const courts = await Court.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Court.countDocuments(query);

    res.json({
      courts,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, admin, async (req, res, next) => {
  try {
    const { name, facilities, pricePerHour, description } = req.body;
    const court = new Court({ name, facilities, pricePerHour, description });
    const createdCourt = await court.save();
    res.status(201).json(createdCourt);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', protect, admin, async (req, res, next) => {
  try {
    const { name, facilities, pricePerHour, description } = req.body;
    const court = await Court.findById(req.params.id);

    if (court) {
      court.name = name || court.name;
      court.facilities = facilities || court.facilities;
      court.pricePerHour = pricePerHour || court.pricePerHour;
      court.description = description || court.description;
      const updatedCourt = await court.save();
      res.json(updatedCourt);
    } else {
      res.status(404);
      throw new Error('Court not found');
    }
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', protect, admin, async (req, res, next) => {
  try {
    const court = await Court.findById(req.params.id);
    if (court) {
      await Court.deleteOne({ _id: req.params.id });
      res.json({ message: 'Court removed' });
    } else {
      res.status(404);
      throw new Error('Court not found');
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Create new review
// @route   POST /api/courts/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const court = await Court.findById(req.params.id);

    if (court) {
      const alreadyReviewed = court.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        res.status(400);
        throw new Error('Court already reviewed');
      }

      // Check if user has an approved booking for this court
      const hasBooked = await Booking.findOne({
        user: req.user._id,
        court: req.params.id,
        status: 'Approved'
      });

      if (!hasBooked) {
        res.status(400);
        throw new Error('You can only review courts you have booked and are approved');
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      court.reviews.push(review);
      court.numReviews = court.reviews.length;
      court.rating =
        court.reviews.reduce((acc, item) => item.rating + acc, 0) /
        court.reviews.length;

      await court.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404);
      throw new Error('Court not found');
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;