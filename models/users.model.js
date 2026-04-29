import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // required: field must be present or Mongoose throws
    name: { type: String, required: true },

    // min: number cannot be below 0
    username: { type: String, required: true },

    // default: value used when field is omitted
    password: { type: String, required: true },
  },
  { versionKey: false } // hides the __v field from output
);

// "Student" → lowercase → pluralize → "students" collection
const User = mongoose.model("User", userSchema);

export default User;