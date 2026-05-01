import express from "express";
const router = express.Router();

const content = []; // In-memory storage for content

//POST /content – Uploads content
router.post("/", (req, res) => {
    const newContent = {
        contentID: Date.now(),...req.body 
    };
    
    content.push(newContent);
    res.status(201).json(newContent);
});

// POST /content/batch – Uploads multiple files
router.post("/batch", (req, res) => {
    const items = req.body.map(item => ({ contentID: Date.now() + Math.random(), ...item }));
    content.push(...items);
    res.status(201).json(items);
});


// GET /content – Lists all content (many)
router.get("/", async (req, res) => {
    res.json(content);
});


// GET /content/recent – Gets recently uploaded contents, TAB
router.get("/recent", async (req, res) => {
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


// GET /content/recent/metadata – Gets metadata from recently uploaded content (X days) TAB
router.get("/recent/metadata", async (req, res) => {
    const recentContent = content.filter(h => {
        const uploadDate = new Date(h.uploadDate);
        const now = new Date();
        const diffTime = Math.abs(now - uploadDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7; // Assuming "recent" means within the last 7 days
    });
    if (recentContent.length === 0) return res.status(404).json({ error: "No recent content found" });
    const recentMetadata = recentContent.map(h => h.metadata);
    res.json(recentMetadata);
});


// GET /content/search?q= – Searches contents, queries (q=)
router.get("/search", (req, res) => {
    const query = req.query.q;

    if (!query) return res.status(400).json({ error: "Query required" });

    const searchResults = content.filter(h => h.name.includes(query) || h.description.includes(query));

    if (searchResults.length === 0) {
         return res.status(404).json({ error: "No results found" });
    }

    res.json(searchResults);
});


// GET /content/metadata – Gets metadata for all of the content
router.get("/metadata", async (req, res) => {
    const allMetadata = content.map(h => h.metadata);
    res.json(allMetadata);
});


// GET /content/metadata/type/:type – Filters metadata by type
router.get("/metadata/type/:type", async (req, res) => {
    const typeContent = content.filter(h => h.type === String(req.params.type));
    if (typeContent.length === 0) return res.status(404).json({ error: "No content found for this type" });
    const typeMetadata = typeContent.map(h => h.metadata);
    res.json(typeMetadata);
});


// GET /content/user/:userId – Get a user's content
router.get("/user/:userId", async (req, res) => {
    const userContent = content.filter(h => h.userID === Number(req.params.userId));
    if (userContent.length === 0) return res.status(404).json({ error: "No content found for this user" });
    res.json(userContent);
});


// GET /content/user/:userId/metadata – Gets metadata from all of the content uploaded by a specified user
router.get("/user/:userId/metadata", async (req, res) => {
    const userContent = content.filter(h => h.userID === Number(req.params.userId));
    if (userContent.length === 0) return res.status(404).json({ error: "No content found for this user" });
    const userMetadata = userContent.map(h => h.metadata);
    res.json(userMetadata);
});


// GET /content/user/:userId/metadata/type/:type – Filters metadata by type for a specific user
router.get("/user/:userId/metadata/type/:type", async (req, res) => {
    const userContent = content.filter(h => h.userID === Number(req.params.userId) && h.type === String(req.params.type));
    if (userContent.length === 0) return res.status(404).json({ error: "No content found for this user and type" });
    const userTypeMetadata = userContent.map(h => h.metadata);
    res.json(userTypeMetadata);
});


// GET /content/type/:type – Filters by type like text, image, or video
router.get("/type/:type", async (req, res) => {
    const typeContent = content.filter(h => h.type === String(req.params.type));
    if (typeContent.length === 0) return res.status(404).json({ error: "No content found for this type" });
    res.json(typeContent);
});


// GET /content/:id – Gets a content details 
router.get("/:id", async (req, res) => {
    const item = content.find(h => h.contentID === Number(req.params.id));
    if (!item) return res.status(404).json({ error: "Content not found" });
    res.json(item);
});


// GET /content/:id/history – Gets version history
router.get("/:id/history", async (req, res) => {
    const item = content.find(h => h.contentID === Number(req.params.id));
    if (!item) return res.status(404).json({ error: "Content not found" });
    res.json(item.history);
});


// GET /content/:id/metadata – Gets metadata for a single content item
router.get("/:id/metadata", async (req, res) => {
    const item = content.find(h => h.contentID === Number(req.params.id));
    if (!item) return res.status(404).json({ error: "Content not found" });
    res.json(item.metadata);
});


// PUT /content/:id – Updates a content 
router.put("/:id", (req, res) => {
    const idx = content.findIndex(h => h.contentID === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: "Content not found" });
    content[idx] = { contentID: Number(req.params.id), ...req.body };
    res.json(content[idx]);
});


// DELETE /content/:id – Deletes a content 
router.delete("/:id", (req, res) => {
    const idx = content.findIndex(h => h.contentID === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    const removed = content.splice(idx, 1)[0];
    res.json(removed);
});


export default router;