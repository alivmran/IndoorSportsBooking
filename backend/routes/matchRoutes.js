const express = require('express');
const router = express.Router();
const MatchPost = require('../models/MatchPost');
const Request = require('../models/Request');
const Team = require('../models/Team');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

// ==========================
// MATCH POSTS ROUTES
// ==========================

// @desc    Create a new Match Post
// @route   POST /api/matches/posts
// @access  Private
router.post('/posts', protect, async (req, res, next) => {
  try {
    const { 
        bookingId, 
        teamName, 
        mobile, 
        lookingForPlayers, 
        playersNeeded, 
        opponentSize 
    } = req.body;
    
    // 1. Verify that the booking belongs to the user
    const booking = await Booking.findById(bookingId).populate('court');
    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Invalid booking or you do not own this booking');
    }

    // 2. Prevent duplicate posts for the same booking
    const existing = await MatchPost.findOne({ booking: bookingId });
    if(existing) {
        res.status(400);
        throw new Error('A post already exists for this booking');
    }

    // 3. Create the post
    const post = await MatchPost.create({
      user: req.user._id,
      booking: bookingId,
      court: booking.court._id,
      date: booking.date,
      startTime: booking.startTime,
      teamName,
      mobile,
      lookingForPlayers: lookingForPlayers || false,
      // If looking for players, save how many needed. If looking for team, save opponent size.
      playersNeeded: lookingForPlayers ? playersNeeded : 0,
      opponentSize: !lookingForPlayers ? opponentSize : 0,
      status: 'Open'
    });
    
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

// @desc    Get all Open Match Posts
// @route   GET /api/matches/posts
// @access  Public
router.get('/posts', async (req, res, next) => {
  try {
    const posts = await MatchPost.find({ status: 'Open' })
      .populate('user', 'name') // Captain's name
      .populate('court', 'name sportType location') // Court details
      .sort({ createdAt: -1 }); // Newest first
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// ==========================
// REQUEST SYSTEM ROUTES
// ==========================

// @desc    Send a Challenge or Join Request
// @route   POST /api/matches/requests
// @access  Private
router.post('/requests', protect, async (req, res, next) => {
  try {
    const { type, targetId } = req.body; // type: 'CHALLENGE' or 'JOIN'
    let receiverId;
    let teamId = null;
    let matchPostId = null;

    if (type === 'CHALLENGE') {
      // Target is a MatchPost
      const post = await MatchPost.findById(targetId);
      if (!post) throw new Error('Match Post not found');
      receiverId = post.user;
      matchPostId = targetId;

    } else if (type === 'JOIN') {
      // Target could be a Team OR a MatchPost (if joining a match as solo)
      
      // Check if it's a Team
      const team = await Team.findById(targetId);
      if (team) {
          receiverId = team.captain;
          teamId = targetId;
      } else {
          // Check if it's a MatchPost
          const post = await MatchPost.findById(targetId);
          if(post) {
            receiverId = post.user;
            matchPostId = targetId;
          } else {
            res.status(404);
            throw new Error('Target (Team or Match) not found');
          }
      }
    } else {
        res.status(400);
        throw new Error('Invalid Request Type');
    }

    // Prevent requesting yourself
    if (receiverId.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('You cannot send a request to yourself');
    }

    // Check if request already exists
    const query = {
        sender: req.user._id,
        receiver: receiverId,
        status: 'PENDING',
        type: type
    };
    if (matchPostId) query.matchPost = matchPostId;
    if (teamId) query.team = teamId;

    const existing = await Request.findOne(query);

    if(existing) {
        res.status(400);
        throw new Error('You have already sent a request.');
    }

    // Create Request
    const request = await Request.create({
        sender: req.user._id,
        receiver: receiverId,
        type,
        matchPost: matchPostId,
        team: teamId
    });

    res.status(201).json(request);

  } catch (error) {
    next(error);
  }
});

// @desc    Get My Incoming Requests (Inbox)
// @route   GET /api/matches/requests/inbox
// @access  Private
router.get('/requests/inbox', protect, async (req, res, next) => {
    try {
        const requests = await Request.find({ receiver: req.user._id, status: 'PENDING' })
            .populate('sender', 'name email')
            .populate({
                path: 'matchPost',
                populate: { path: 'court', select: 'name' }
            })
            .populate('team', 'name');
        res.json(requests);
    } catch (error) {
        next(error);
    }
});

// @desc    Accept or Reject a Request
// @route   PUT /api/matches/requests/:id
// @access  Private
router.put('/requests/:id', protect, async (req, res, next) => {
    try {
        const { status } = req.body; // 'ACCEPTED' or 'REJECTED'
        
        const request = await Request.findById(req.params.id);

        if(!request) {
            res.status(404);
            throw new Error('Request not found');
        }

        // Verify receiver
        if(request.receiver.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to respond to this request');
        }

        request.status = status;
        await request.save();

        if (status === 'ACCEPTED') {
            // Case 1: Joining a Permanent Team
            if (request.type === 'JOIN' && request.team) {
                const team = await Team.findById(request.team);
                if(team) {
                    team.memberCount += 1;
                    await team.save();
                }
            }

            // Case 2: Joining a Match Post (Solo Player)
            if (request.type === 'JOIN' && request.matchPost) {
                const post = await MatchPost.findById(request.matchPost);
                if(post && post.playersNeeded > 0) {
                    post.playersNeeded -= 1; // Decrease needed count
                    if(post.playersNeeded === 0) {
                        post.status = 'Closed'; // Close if full
                    }
                    await post.save();
                }
            }

            // Case 3: Challenging a Team (Match Set)
            if (request.type === 'CHALLENGE' && request.matchPost) {
                const post = await MatchPost.findById(request.matchPost);
                if(post) {
                    post.status = 'Closed'; // Match is set
                    await post.save();
                }
            }
        }

        res.json(request);
    } catch (error) {
        next(error);
    }
});

module.exports = router;