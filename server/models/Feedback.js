// server/models/Feedback.js
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'SessionRequest', required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reviewer
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reviewee
    rating: { type: Number, min: 1, max: 5, required: true },
    comments: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
