const mongoose = require("mongoose");

const hashSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    input: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
      default: "sha256",
    },

    hash: {
      type: String,
      required: true,
    },

    contentId: {
      type: String,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const Hash = mongoose.model("Hash", hashSchema);

module.exports = Hash;