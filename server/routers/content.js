import express from "express";
const router = express.Router();

// Content endpoints

router.get("/test", (req, res) => {
    res.send("Content API is working")
});

export default router;



//POST /content – Uploads content



// GET /content – Lists all content (many)



// GET /content/:id – Gets a content details 



// PUT /content/:id – Updates a content 



// DELETE /content/:id – Deletes a content 



// POST /content/batch – Uploads multiple files



// GET /content/user/:userId – Get a user’s content



// GET /content/type/:type – Filters by type like text, image, or video



// GET /content/recent – Gets recently uploaded contents



// GET /content/search?q= – Searches contents, queries (q=)



// GET /content/:id/history – Gets version history



// GET /content/:id/metadata – Gets metadata for a single content item



// GET /content/metadata – Gets metadata for all of the content



// GET /content/user/:userId/metadata – Gets metadata from all of the content uploaded by a specified user



// GET /content/recent/metadata – Gets metadata from recently uploaded content (X days)



// GET /content/metadata/type/:type – Filters metadata by type



// GET /content/user/:userId/metadata/type/:type – Filters metadata by type for a specific user
