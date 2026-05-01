import crypto from 'crypto';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';


const router = express.Router();


const hashes = []; // In-memory storage for hashes


function generateHash(data) {
   return crypto.createHash
   ('sha256').update(data).digest('hex');
}


// POST /hash/generate – Generates a hash
router.post("/generate", (req, res) => {
   const { input, type } = req.body;
   if (!input || !type) {
       return res.status(400).json({ error: "Input and type are required" });
   }
   try {
       const hash = generateHash(input);
       const hashRecord = { id: uuidv4(), hash, type, contentID: null };
       hashes.push(hashRecord); // Store the hash record in memory
       res.json({ hash });
   } catch (err) {
       res.status(500).json({ error: err.message });
   }
});


// // GET /hash/:id – Gets a hash record
// router.get("/:id", (req, res) => {
//    const hashRecord = hashes.find(h => h.id === Number(req.params.id));
//    if (!hashRecord) return res.status(404).json({ error: "Hash not found" });
//    res.json(hashRecord);
// });


// GET /hash/content/:contentId – Gets hashes for content
router.get("/content/:contentId", (req, res) => {
   const hashRecord = hashes.filter(h => h.contentID === (req.params.contentId));
    if (!hashRecord.length) return res.status(404).json({ error: "Hash not found" });
   res.json(hashRecord);
});


// GET /hash/:id – Gets a hash record
router.get("/:id", (req, res) => {
   const hashRecord = hashes.find(h => h.id === (req.params.id));
   if (!hashRecord) return res.status(404).json({ error: "Hash not found" });
   res.json(hashRecord);
});


// POST /hash/batch – Hashes several items at a time
router.post("/batch", (req, res) => {
   const { items } = req.body;
   if (!items || !Array.isArray(items)) {
       return res.status(400).json({ error: "Items array is required" });
   }
   try {
       const results = items.map(({ input, type }) => {
           const hash = generateHash(input);
           const hashRecord = { id: uuidv4(), hash, type, contentID: null };
           hashes.push(hashRecord); // Store the hash record in memory
           return { input, type, hash };
       });
       res.json({ hashes: results });
   } catch (err) {
       res.status(500).json({ error: err.message });
   }
});




// GET /hash/type/:type – Filters by hash type
router.get("/type/:type", (req, res) => {
   const hashRecords = hashes.filter(h => h.type === String(req.params.type));
      if (!hashRecords.length) return res.status(404).json({ error: "Hash not found" });
   res.json(hashRecords);
});




// DELETE /hash/:id – Deletes a hash
router.delete("/:id", (req, res) => {
   const idx = hashes.findIndex(h => h.id === req.params.id);
   if (idx === -1) {
       return res.status(404).json({ error: "Hash not found" });
   }
   const deletedHash = hashes.splice(idx, 1)[0]; // Remove from array and get deleted record
   res.json({ message: "Deleted successfully", hash: deletedHash });
});




// GET /hash/:hash/value – Search by hash value
router.get("/:hash/value", (req, res) => {
   const hashRecord = hashes.find(h => h.hash === (req.params.hash))
   if (!hashRecord)return res.status(404).json({ error: "Hash not found" });
   res.json(hashRecord);
});




// GET /hash/stats – Get hash statistics
router.get("/stats", (req, res) => {
   const totalHashes = hashes.length;

   const typesCount = hashes.reduce((acc, h) => {
       acc[h.type] = (acc[h.type] || 0) + 1;
       return acc;
   }, {});

   res.json({ totalHashes, typesCount });
});



// GET /hash/recent – Get recent hashes
router.get("/recent", (req, res) => {
   const recentHashes = hashes.slice(-10).reverse(); 
    if (!recentHashes.length) return res.status(404).json({ error: "Hash not found" });
   res.json(recentHashes);
});


export { generateHash };
export default router;