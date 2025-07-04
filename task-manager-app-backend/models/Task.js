// models/Task.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    // Reference to the User model, linking tasks to specific users
    userId: {
      type: mongoose.Schema.Types.ObjectId, // This is a special type for MongoDB IDs
      ref: "User", // This tells Mongoose that it refers to the 'User' model
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date, // Stores dates
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"], // Only allows these specific values
      default: "Medium",
    },
    completed: {
      type: Boolean,
      default: false, // Tasks are not completed by default
    },
    reminder: {
      type: Date, // Store the time for a reminder
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now, // Will be updated on every save
    },
  },
  {
    timestamps: true, // Mongoose will automatically manage createdAt and updatedAt fields
    // NOTE: If you use `timestamps: true`, you might want to remove the manual createdAt and updatedAt fields above
    // For this example, let's keep them explicit for now, or just use `timestamps: true`
    // Let's go with `timestamps: true` to simplify:
  }
);

// If using `timestamps: true`, you can remove the createdAt and updatedAt fields from the schema definition above.
// Mongoose will add them automatically and manage them.
// So, the schema definition would look like:
// const taskSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     title: { type: String, required: true, trim: true, minlength: 1 },
//     description: { type: String, trim: true },
//     dueDate: { type: Date },
//     priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
//     completed: { type: Boolean, default: false },
//     reminder: { type: Date }
// }, {
//     timestamps: true
// });

module.exports = mongoose.model("Task", taskSchema);
