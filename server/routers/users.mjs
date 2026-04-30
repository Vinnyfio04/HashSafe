import { createServer } from 'node:http';
import connectDB  from '../config/db';
import User from '../../models/users.model';

const PORT = 3000;

function json(res, status, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
  }
  function notFound(res) { return json(res, 404, { error: 'Not found' }); }

  function readBody(req) { // NEW: bring body parsing back (we need POST)
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }

  function parseId(pathname) { // NEW: support /users/:id
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length !== 2) return null;
    const id = Number(parts[1]);
    return Number.isFinite(id) ? id : null;
  }

  createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
  


// DELETE /users/:id – Delete user account



// PUT /users/:id – Updates a user



// GET /users/:id – Gets a users profile (1 profile)



// GET /users – Lists users (many)
    
  })

