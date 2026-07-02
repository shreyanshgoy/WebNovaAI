// server.js
// Main Express server for AI Website Builder backend
// This server exposes the /api/vercel-publish endpoint for Vercel deployment

import express from 'express';
import cors from 'cors';
import vercelPublish from './vercel-publish.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // Enable CORS for all origins (adjust as needed)
app.use(express.json()); // Parse JSON request bodies

// Mount the Vercel publish route
app.use(vercelPublish);

// Health check route
app.get('/', (req, res) => res.send('Server is running!'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 