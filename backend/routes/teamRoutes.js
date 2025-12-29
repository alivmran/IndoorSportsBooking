const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const { protect } = require('../middleware/authMiddleware');

// Create Team
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, sportType, memberCount, description, lookingForMatch } = req.body;
    
    const existingTeam = await Team.findOne({ captain: req.user._id });
    if(existingTeam) {
        res.status(400);
        throw new Error('You already have a team');
    }

    const team = await Team.create({
        name,
        captain: req.user._id,
        sportType,
        memberCount: memberCount || 1,
        description,
        lookingForMatch
    });
    res.status(201).json(team);
  } catch (error) {
    next(error);
  }
});

// Update Team (General Info + Member Count)
router.put('/', protect, async (req, res, next) => {
    try {
        const { name, sportType, description, memberCount, lookingForMatch } = req.body;
        const team = await Team.findOne({ captain: req.user._id });
        
        if(!team) {
            res.status(404);
            throw new Error('Team not found');
        }

        team.name = name || team.name;
        team.sportType = sportType || team.sportType;
        team.description = description || team.description;
        team.memberCount = memberCount || team.memberCount;
        team.lookingForMatch = lookingForMatch !== undefined ? lookingForMatch : team.lookingForMatch;

        const updatedTeam = await team.save();
        res.json(updatedTeam);
    } catch (error) {
        next(error);
    }
});

router.get('/find-match', async (req, res, next) => {
  try {
    const { sport } = req.query;
    let query = { lookingForMatch: true };
    if (sport) query.sportType = sport;
    const teams = await Team.find(query).populate('captain', 'name');
    res.json(teams);
  } catch (error) {
    next(error);
  }
});

router.get('/my-team', protect, async (req, res, next) => {
    try {
        const team = await Team.findOne({ captain: req.user._id });
        res.json(team);
    } catch (error) {
        next(error);
    }
});

module.exports = router;