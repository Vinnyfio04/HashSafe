// Used express and mongoose slides

import express from 'express';
const router = express.Router();

import content from "../data/content.mjs";


// GET /stats/content/type – Gets a content count for each type (photo/video) TAB
router.get("/content/type", async (req, res) => {
    const typeCounts = content.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
    }, {});
    res.json(typeCounts);
});


// GET /stats/recent/uploads – Gets content that has been uploaded recently (X days) TAB
router.get("/recent/uploads", async (req, res) => {
   const recentContent = content.filter(h => {
       const uploadDate = new Date(h.uploadDate);
       const now = new Date();
       const diffTime = Math.abs(now - uploadDate);
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
       return diffDays <= 7; // Assuming "recent" means within the last 7 days
   });
   if (recentContent.length === 0) return res.status(404).json({ error: "No recent content found" });
   res.json(recentContent);
});

export default router;