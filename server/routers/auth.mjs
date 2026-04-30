import express from "express";
import User from "../../models/users.model.js";
const router = express.Router();

// POST /auth/register – Creates an account for a user
router.post("/register", async (req, res) => {
    try {
      const user = await User.create(req.body);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });


// POST /auth/login – Logs a user into the system



// POST /auth/logout – Logs a user out of the system

export default router;