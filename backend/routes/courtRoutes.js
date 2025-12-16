const express = require('express');
const router = express.Router();
const Court = require('../models/Court');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', async (req, res, next) => {
  try {
    const courts = await Court.find({});
    res.json(courts);
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, admin, async (req, res, next) => {
  try {
    const { name, sportType, pricePerHour, description } = req.body;
    const court = new Court({ name, sportType, pricePerHour, description });
    const createdCourt = await court.save();
    res.status(201).json(createdCourt);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', protect, admin, async (req, res, next) => {
  try {
    const { name, sportType, pricePerHour, description } = req.body;
    const court = await Court.findById(req.params.id);

    if (court) {
      court.name = name || court.name;
      court.sportType = sportType || court.sportType;
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

module.exports = router;