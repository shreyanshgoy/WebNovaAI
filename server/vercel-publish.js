// vercel-publish.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
// === CONFIGURATION ===
// Set your Vercel personal token and team in a .env file (do NOT expose in frontend!)
const VERCEL_TOKEN = process.env.VERCEL_TOKEN; // Set this in your .env file
const VERCEL_TEAM = process.env.VERCEL_TEAM; // Set this in your .env file if needed

function makeFiles({ html, css, js }) {
  return [
    { file: 'index.html', data: html },
    { file: 'style.css', data: css },
    { file: 'script.js', data: js },
  ];
}

// Helper to inject CSS/JS references into HTML
function injectAssets(html) {
  // Add CSS link in <head> if not present
  let newHtml = html.replace(
    /<head([^>]*)>/i,
    `<head$1>\n<link rel="stylesheet" href="style.css">`
  );
  // Add JS script before </body> if not present
  newHtml = newHtml.replace(
    /<\/body>/i,
    `<script src="script.js"></script>\n</body>`
  );
  return newHtml;
}

router.post('/api/vercel-publish', async (req, res) => {
  console.log('Received publish request:', req.body); // Add this line
  try {
    const { html, css, js, projectName } = req.body;
    if (!html || !css || !js) {
      return res.status(400).json({ error: 'Missing files' });
    }

    const injectedHtml = injectAssets(html);
const files = makeFiles({ html: injectedHtml, css, js }).map(f => ({
  file: f.file,
  data: Buffer.from(f.data).toString('base64'),
  encoding: 'base64',
}));

const payload = {
  name: projectName ? projectName.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase() : 'ai-website',
  files,
  builds: [
    { src: '**', use: '@vercel/static' }
  ],
  routes: [
    {
      src: "/(.*\\.css)",
      dest: "/$1"
    },
    {
      src: "/(.*\\.js)",
      dest: "/$1"
    },
    {
      src: "/(.*)",
      dest: "/index.html"
    }
  ]
};

    const vercelRes = await fetch(
      `https://api.vercel.com/v13/deployments${VERCEL_TEAM ? `?teamId=${VERCEL_TEAM}` : ''}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
    const vercelData = await vercelRes.json();
    if (!vercelRes.ok) {
      return res.status(500).json({ error: vercelData.error?.message || 'Vercel deploy failed' });
    }
    return res.json({ url: vercelData.url ? `https://${vercelData.url}` : undefined });
  } catch (err) {
    console.error('Vercel publish error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router; 

