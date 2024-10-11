// server/models/SessionRequest.js
const mongoose = require('mongoose');

const sessionRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    requestedTime: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    feedback: String, // Feedback after session completion
  },
  { timestamps: true }
);

module.exports = mongoose.model('SessionRequest', sessionRequestSchema);
