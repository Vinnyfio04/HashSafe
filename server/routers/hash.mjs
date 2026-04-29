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
fetch("https://jsonplaceholder.typicode.com/posts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    input: document.getElementById("inputData").value,
    type: document.getElementById("hashType").value,
    id: uuidv4() // Generate a unique ID for the hash record 
  })
})
  .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
  })
  .then((data) => {
      console.log("Generated Hash:", data.hash);
        // Optionally, you can store the hash in the in-memory array - TAB
  })
  .catch((error) => {
      console.error("Error:", error.message);
  });

// GET /hash/:id – Gets a hash record
fetch("https://jsonplaceholder.typicode.com/posts/1")
  .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
  })
  .then((data) => {
      console.log("Retrieved Hash:", data.hash);
  })
  .catch((error) => {
      console.error("Error:", error.message);
  });

// GET /hash/content/:contentId – Gets hashes for content



// POST /hash/batch – Hashes several items at a time 



// GET /hash/type/:type – Filters by hash type



// DELETE /hash/:id – Deletes a hash



// GET /hash/:hash/value – Search by hash value



// GET /hash/stats – Get hash statistics



// GET /hash/recent – Get recent hashes

export default generateHash;
