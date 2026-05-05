// Used express and mongoose slides

import express from "express";
import User from "../models/users.model.js";
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
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }
    try {
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // In a real application, you would generate a token here
        res.json({ message: "Login successful", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// POST /auth/logout – Logs a user out of the system
router.post("/logout", (req, res) => {
    // In a real application, you would handle token invalidation here
    res.json({ message: "Logout successful" });
});

export default router;