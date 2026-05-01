import express from "express";
import User from "../models/users.model.js";
const router = express.Router();

//copied from Mongoose and express slides 

// DELETE /users/:id – Delete user account
router.delete("/:id", async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Deleted successfully", user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


// PUT /users/:id – Updates a user
router.put("/:id", async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!user) return res.status(404).json({ error: "Not found" });
      res.json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });


// GET /users/:id – Gets a users profile (1 profile)
router.get("/:id", async (req, res) => {
    try{
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "Not found" });
        res.json(user);
    } catch {
        res.status(400).json({error: "Invalid ID"});
    }
});


// GET /users – Lists users (many)
router.get("/", async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });  
  
  export default router;


