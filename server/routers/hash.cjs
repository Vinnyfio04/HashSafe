const crypto = require('crypto');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const hashes = []; // In-memory storage for hashes

function generateHash(data) {
    return crypto.createHash
    ('sha256').update(data).digest('hex');
}

// POST /hash/generate – Generates a hash



// GET /hash/:id – Gets a hash record



// GET /hash/content/:contentId – Gets hashes for content



// POST /hash/batch – Hashes several items at a time 



// GET /hash/type/:type – Filters by hash type



// DELETE /hash/:id – Deletes a hash



// GET /hash/:hash/value – Search by hash value



// GET /hash/stats – Get hash statistics



// GET /hash/recent – Get recent hashes


module.exports = generateHash;