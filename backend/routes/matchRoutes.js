const express = require('express');
const router = express.Router();
const MatchPost = require('../models/MatchPost');
const Request = require('../models/Request');

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
      adHocTeamName,
      mobile,
      mySquadSize,
      opponentSquadSize
    } = req.body;

    // 1. Verify that the booking belongs to the user
    const booking = await Booking.findById(bookingId).populate('court');
    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Invalid booking or you do not own this booking');
    }

    // 2. Prevent duplicate posts for the same booking
    const existing = await MatchPost.findOne({ booking: bookingId });
    if (existing) {
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
      adHocTeamName,
      mobile,
      mySquadSize,
      opponentSquadSize,
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
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const posts = await MatchPost.find({ status: 'Open', date: { $gte: today } })
      .populate('user', 'name') // Captain's name
      .populate('court', 'name sportType location') // Court details
      .sort({ createdAt: -1 }); // Newest first
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// @desc    Get Match History
// @route   GET /api/matches/history
// @access  Private
router.get('/history', protect, async (req, res, next) => {
  try {
    // --- BACKGROUND CLEANUP ---
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    MatchPost.deleteMany({ date: { $lt: thirtyDaysAgo } }).exec().catch(e => console.error('Cleanup error:', e));
    // --------------------------

    const hosted = await MatchPost.find({ user: req.user._id, status: 'Closed' })
      .populate('court', 'name sportType location')
      .sort({ createdAt: -1 });

    const requests = await Request.find({ sender: req.user._id, status: 'ACCEPTED' })
      .populate({
        path: 'matchPost',
        populate: { path: 'court', select: 'name sportType location' }
      }).sort({ createdAt: -1 });

    const challenged = requests.map(r => r.matchPost).filter(Boolean);

    res.json({ hosted, challenged });
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
    const { type, targetId } = req.body; // type: 'CHALLENGE'
    let receiverId;
    let matchPostId = null;

    if (type === 'CHALLENGE') {
      const post = await MatchPost.findById(targetId);
      if (!post) throw new Error('Match Post not found');
      receiverId = post.user;
      matchPostId = targetId;
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

    const existing = await Request.findOne(query);

    if (existing) {
      res.status(400);
      throw new Error('You have already sent a request.');
    }

    // Create Request
    const request = await Request.create({
      sender: req.user._id,
      receiver: receiverId,
      type,
      matchPost: matchPostId
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
      });
    res.json(requests);
  } catch (error) {
    next(error);
  }
});

// @desc    Get My Sent Requests (Sent Challenges)
// @route   GET /api/matches/requests/sent
// @access  Private
router.get('/requests/sent', protect, async (req, res, next) => {
  try {
    const requests = await Request.find({ sender: req.user._id })
      .populate('receiver', 'name email')
      .populate({
        path: 'matchPost',
        populate: { path: 'court', select: 'name' },
        select: 'date startTime adHocTeamName mobile court'
      }).sort({ createdAt: -1 });
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

    if (!request) {
      res.status(404);
      throw new Error('Request not found');
    }

    // Verify receiver
    if (request.receiver.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to respond to this request');
    }

    request.status = status;
    await request.save();

    if (status === 'ACCEPTED') {


      // Case 3: Challenging a Team (Match Set)
      if (request.type === 'CHALLENGE' && request.matchPost) {
        const post = await MatchPost.findById(request.matchPost);
        if (post) {
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