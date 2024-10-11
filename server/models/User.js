// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'tutor', 'admin'], required: true },
    // Tutor-specific fields
    subjects: [{ type: String }],
    location: String,
    availability: [
      {
        day: { type: String, required: true },
        time: { type: String, required: true },
      }
    ],
    verificationDocument: String,
    isVerified: { type: Boolean, default: false },
    // Student-specific fields
    learningGoals: String,
    preferredSubjects: [{ type: String }],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);