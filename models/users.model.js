const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // required: field must be present or Mongoose throws
    name: { type: String, required: true },

    // min: number cannot be below 0
    age: { type: Number, required: true, min: 0 },

    // default: value used when field is omitted
    major: { type: String, default: "Undeclared" },
  },
  { versionKey: false } // hides the __v field from output
);

// "Student" → lowercase → pluralize → "students" collection
const User = mongoose.model("User", userSchema);

module.exports = Student;