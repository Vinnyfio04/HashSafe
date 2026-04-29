import express from "express";
const router = express.Router();

// Content endpoints

router.get("/test", (req, res) => {
    res.send("Content API is working")
});

export default router;