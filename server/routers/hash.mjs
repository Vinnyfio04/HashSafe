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
fetch("https://jsonplaceholder.typicode.com/posts/1")
  .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
  })
  .then((data) => {
      console.log("Hashes for Content:", data.hashes);
      console.log("Content ID:", data.contentID);
  })
  .catch((error) => {
      console.error("Error:", error.message);
  });


// POST /hash/batch – Hashes several items at a time 



// GET /hash/type/:type – Filters by hash type
fetch("https://jsonplaceholder.typicode.com/posts/1")
  .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
  })
  .then((data) => {
      console.log("Hashes of Type:", data.hashes);
      console.log("Hash Type:", data.type);
  })
  .catch((error) => {
      console.error("Error:", error.message);
  });


// DELETE /hash/:id – Deletes a hash



// GET /hash/:hash/value – Search by hash value
fetch("https://jsonplaceholder.typicode.com/posts/1")
  .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
  })
  .then((data) => {
      console.log("Search Result for Hash Value:", data.hash);
  })
  .catch((error) => {
      console.error("Error:", error.message);
  });


// GET /hash/stats – Get hash statistics
fetch("https://jsonplaceholder.typicode.com/posts/1")
  .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
  })
  .then((data) => {
      console.log("Hash Statistics:", data.stats);
  })
  .catch((error) => {
      console.error("Error:", error.message);
  });


// GET /hash/recent – Get recent hashes
fetch("https://jsonplaceholder.typicode.com/posts/1")
  .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
  })
  .then((data) => {
      console.log("Recent Hashes:", data.hashes);
  })
  .catch((error) => {
      console.error("Error:", error.message);
  });
  

export default generateHash;
