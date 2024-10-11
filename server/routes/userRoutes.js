// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SessionRequest = require('../models/SessionRequest');
const Feedback = require('../models/Feedback');
const multer = require('multer');
const { isAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Set up multer for file uploads (Verification Document)
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf)$/)) {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

// -------------------
// Registration Route
// -------------------
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      subjects,
      location,
      availability,
      verificationDocument,
      learningGoals,
      preferredSubjects,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create a new user
    const user = new User({
      name,
      email,
      password,
      role,
      subjects: role === 'tutor' ? subjects : undefined,
      location: role === 'tutor' ? location : undefined,
      availability: role === 'tutor' ? availability : undefined,
      verificationDocument: role === 'tutor' ? verificationDocument : undefined,
      learningGoals: role === 'student' ? learningGoals : undefined,
      preferredSubjects: role === 'student' ? preferredSubjects : undefined,
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// -------------------
// Login Route
// -------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Send back user info (no JWT/session for simplicity)
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        careerStatus: user.careerStatus, // Include career status in response
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// -------------------
// Admin: Evaluate Tutor Career Status
// -------------------
router.post('/admin/evaluate-tutor/:tutorId', isAdmin, async (req, res) => {
  const { tutorId } = req.params;
  const { evaluationResult } = req.body; // 'approved' or 'rejected'

  try {
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    tutor.careerStatus = evaluationResult === 'approved' ? 'approved' : 'rejected';
    await tutor.save();

    res.status(200).json({ message: `Tutor evaluation completed: ${tutor.careerStatus}` });
  } catch (error) {
    res.status(500).json({ message: 'Error evaluating tutor', error: error.message });
  }
});

// -------------------
// Get User Profile
// -------------------
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// -------------------
// Update User Profile
// -------------------
router.put('/profile/:id', async (req, res) => {
  try {
    const {
      name,
      subjects,
      location,
      availability,
      learningGoals,
      preferredSubjects,
      preferences,
      verificationDocument,
      mcqTestScore,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields based on the role
    user.name = name || user.name;
    if (user.role === 'tutor') {
      user.subjects = subjects || user.subjects;
      user.location = location || user.location;
      user.availability = availability || user.availability;
      user.verificationDocument = verificationDocument || user.verificationDocument;
      user.mcqTestScore = mcqTestScore || user.mcqTestScore;
    }
    if (user.role === 'student') {
      user.learningGoals = learningGoals || user.learningGoals;
      user.preferredSubjects = preferredSubjects || user.preferredSubjects;
      user.preferences = preferences || user.preferences;
    }

    await user.save();
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// -------------------
// Request Session (Student -> Tutor)
// -------------------
router.post('/session/request', async (req, res) => {
  try {
    const { studentId, tutorId, subject, requestedTime } = req.body;

    // Validate student and tutor
    const student = await User.findById(studentId);
    const tutor = await User.findById(tutorId);

    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    if (!tutor || tutor.role !== 'tutor') {
      return res.status(400).json({ message: 'Invalid tutor ID' });
    }

    // Create a new session request
    const sessionRequest = new SessionRequest({
      student: studentId,
      tutor: tutorId,
      subject,
      requestedTime,
    });

    await sessionRequest.save();
    res.status(201).json({ message: 'Session request sent successfully', sessionRequestId: sessionRequest._id });
  } catch (error) {
    res.status(500).json({ message: 'Error sending session request', error: error.message });
  }
});

// -------------------
// Tutor Respond to Session Request
// -------------------
router.put('/session/:id/respond', async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    const sessionRequest = await SessionRequest.findById(req.params.id);

    if (!sessionRequest) {
      return res.status(404).json({ message: 'Session request not found' });
    }

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    sessionRequest.status = status;
    await sessionRequest.save();
    res.status(200).json({ message: `Session request ${status}`, sessionRequest });
  } catch (error) {
    res.status(500).json({ message: 'Error responding to session request', error: error.message });
  }
});

// -------------------
// Provide Feedback (After Session Completion)
// -------------------
router.post('/session/:id/feedback', async (req, res) => {
  try {
    const { rating, comments, from, to } = req.body; // from: reviewer, to: reviewee
    const sessionRequest = await SessionRequest.findById(req.params.id);

    if (!sessionRequest || sessionRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Invalid session or session not completed' });
    }

    // Create feedback
    const feedback = new Feedback({
      session: sessionRequest._id,
      from,
      to,
      rating,
      comments,
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting feedback', error: error.message });
  }
});

// -------------------
// Admin Routes (Protected by isAdmin Middleware)
// -------------------

// Get All Users
router.get('/admin/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Verify Tutor (Admin)
router.put('/admin/users/:id/verify', isAdmin, async (req, res) => {
  try {
    const { verificationStatus } = req.body; // 'verified' or 'rejected'
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'tutor') {
      return res.status(400).json({ message: 'Invalid user or user is not a tutor' });
    }

    if (!['verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    user.verificationStatus = verificationStatus;
    await user.save();
    res.status(200).json({ message: 'Tutor verification status updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating tutor verification', error: error.message });
  }
});

// Get All Session Requests
router.get('/session-requests', async (req, res) => {
  const { role, userId } = req.query;

  try {
    let sessionRequests;

    // If the user is a student, fetch session requests where they are the student
    if (role === 'student') {
      sessionRequests = await SessionRequest.find({ student: userId }).populate('tutor', 'name');
    }
    // If the user is a tutor, fetch session requests where they are the tutor
    else if (role === 'tutor') {
      sessionRequests = await SessionRequest.find({ tutor: userId }).populate('student', 'name');
    } else {
      return res.status(400).json({ message: 'Invalid user role' });
    }

    if (sessionRequests.length === 0) {
      return res.status(200).json({ message: 'No session requests found', requests: [] });
    }

    return res.status(200).json({ requests: sessionRequests });
  } catch (error) {
    console.error('Error fetching session requests:', error);
    return res.status(500).json({ message: 'Error fetching session requests', error: error.message });
  }
});

//----------------------------
// Search Users
//----------------------------

router.get('/search', async (req, res) => {
  try {
    const { query, role } = req.query;
    let searchQuery = {};

    if (role === 'student') {
      // Students can search for tutors by name or subject
      searchQuery = {
        role: 'tutor',
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { subjects: { $regex: query, $options: 'i' } }
        ]
      };
    } else if (role === 'tutor') {
      // Tutors can search for students by name
      searchQuery = {
        role: 'student',
        name: { $regex: query, $options: 'i' }
      };
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const searchResults = await User.find(searchQuery).select('-password');
    res.status(200).json({ results: searchResults });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

// -------------------
// Admin: Get All Tutors
// -------------------
router.get('/admin/tutors', isAdmin, async (req, res) => {
  try {
    const tutors = await User.find({ role: 'tutor' }).select('-password');
    res.status(200).json({ tutors });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tutors', error: error.message });
  }
});

// -------------------
// Admin: Get All Students
// -------------------
router.get('/admin/students', isAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// -------------------
// Admin: Get All Session Requests
// -------------------
router.get('/admin/session-requests', isAdmin, async (req, res) => {
  try {
    const sessionRequests = await SessionRequest.find()
      .populate('student', 'name')
      .populate('tutor', 'name');
    res.status(200).json({ sessionRequests });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching session requests', error: error.message });
  }
});

// -------------------
// Admin: Get All Feedbacks
// -------------------
router.get('/admin/feedbacks', isAdmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('from', 'name role')
      .populate('to', 'name role');
    res.status(200).json({ feedbacks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedbacks', error: error.message });
  }
});

module.exports = router;
