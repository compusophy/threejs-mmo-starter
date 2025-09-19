// Simple AI backend server for workbench interactions
// Requires: npm install express cors dotenv @google/genai mime

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mime from 'mime';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
// Serve static assets so imagePath works in the client (e.g., /assets/images/xxx.png)
app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function saveBase64Image(dataUrl, outPath) {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) throw new Error('Invalid data URL');
  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(outPath, buffer);
  return { mimeType, size: buffer.length };
}

function saveDataUrlToImages(dataUrl, fileNamePrefix = 'wb-item') {
  ensureDir(path.join(process.cwd(), 'assets', 'images'));
  const ts = Date.now();
  const outName = `${fileNamePrefix}-${ts}.png`;
  const outPath = path.join(process.cwd(), 'assets', 'images', outName);
  saveBase64Image(dataUrl, outPath);
  return `assets/images/${outName}`;
}

function listImagesSortedByMtime() {
  try {
    const dir = path.join(process.cwd(), 'assets', 'images');
    ensureDir(dir);
    const files = fs.readdirSync(dir)
      .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
      .map(f => `assets/images/${f.name}`);
    return files;
  } catch {
    return [];
  }
}

// Generate an item image from a prompt
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, fileNamePrefix = 'item', forceGreenScreen = true } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not set. Requests will fail.');
    }

    const model = 'gemini-2.5-flash-image-preview';
    const config = { responseModalities: ['IMAGE', 'TEXT'] };
    // Augment user prompt to strictly forbid any environment and enforce transparency
    const guardrails = `
Generate ONE low-poly, game-ready object on a FULLY TRANSPARENT background.
HARD REQUIREMENTS (all must be satisfied):
- Output: 1024x1024 PNG with alpha transparency
- Background: fully transparent outside the object's silhouette
- Absolutely NO environment/props: no castle, buildings, terrain, grass, plants, sky, walls, floors
- Absolutely NO ground plane, grid, checkerboard, guides, axes, horizon, or wireframe overlays
- Absolutely NO shadows/reflections, no contact/ambient shadows
- No depth-of-field, blur, bloom, vignette, grain, bokeh
- No text, labels, logos, watermarks, badges, or UI
- Subject centered, full in frame, not cropped, neutral lighting

${forceGreenScreen ? 'If transparency is not possible, you MUST render on a SOLID chroma key background of #00FF00 (pure green), with NO patterns, NO grid, and NO shadows.' : 'Do not render any background if transparency unsupported; the request requires transparency.'}
`;
    const contents = [
      { role: 'user', parts: [{ text: `${prompt}\n\n${guardrails}` }] },
    ];

    const response = await ai.models.generateContentStream({ model, config, contents });
    let text = '';
    let firstImage = null;
    let imageIndex = 0;

    for await (const chunk of response) {
      const parts = chunk?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part?.inlineData && !firstImage) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const ext = mime.getExtension(mimeType) || 'png';
          const data = part.inlineData.data || '';
          const dataUrl = `data:${mimeType};base64,${data}`;
          firstImage = { mimeType, ext, dataUrl, index: imageIndex++ };
        }
        if (part?.text) text += part.text;
      }
    }

    return res.json({
      prompt,
      text,
      image: firstImage,
      savedPath: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate image', details: String(err) });
  }
});

// Analyze an image into structured components
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageDataUrl, instructions } = req.body || {};
    if (!imageDataUrl) return res.status(400).json({ error: 'Missing imageDataUrl' });

    const match = imageDataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) return res.status(400).json({ error: 'Invalid image data URL' });
    const [, mimeType, base64] = match;

    const model = 'gemini-2.5-pro';
    const prompt = `You are a 3D asset analyst for a low-poly Three.js game.
Return STRICT JSON only with these keys: {
  "name": string,
  "components": [{"name": string, "shape": "box|cylinder|sphere|cone|torus|capsule|prism", "dimensions": {"x": number, "y": number, "z": number, "radius?": number, "height?": number, "detail?": number}, "position": {"x": number, "y": number, "z": number}, "rotation": {"x": number, "y": number, "z": number}, "color": string }],
  "materials": [string],
  "dominantColors": [string],
  "styleNotes": string
}
Units arbitrary but consistent. Center near origin. ${instructions || ''}`;

    const contents = [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      },
    ];

    const response = await ai.models.generateContent({ model, contents });
    const text = response?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      // Attempt to extract JSON block
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        json = JSON.parse(m[0]);
      } else {
        return res.json({ raw: text });
      }
    }

    // No filesystem persistence; return analysis blob
    return res.json({ analysis: json, savedPath: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to analyze image', details: String(err) });
  }
});

// Generate Three.js code from analysis
app.post('/api/generate-threejs', async (req, res) => {
  try {
    const { analysis, promptAddon } = req.body || {};
    if (!analysis) return res.status(400).json({ error: 'Missing analysis' });

    const model = 'gemini-2.5-pro';
    const sys = `Write ONLY a JavaScript function named createGeneratedItem that accepts (THREE) and returns a THREE.Group. Use only primitives (BoxGeometry, CylinderGeometry, SphereGeometry, ConeGeometry, TorusGeometry), MeshLambertMaterial with hex colors, and simple transforms.
No external loaders, no fetch, no imports, no lights, no scenes. Keep polycount low. Center near origin. Do not wrap in markdown. End with: return group;`;

    const user = `Here is the analysis JSON for the item:\n${JSON.stringify(analysis)}\n${promptAddon || ''}`;

    const contents = [
      { role: 'user', parts: [{ text: sys + '\n' + user }] },
    ];

    const response = await ai.models.generateContent({ model, contents });
    let code = response?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';

    // Strip markdown fences if present
    code = code.replace(/```[a-z]*\n([\s\S]*?)```/gi, '$1').trim();

    // Ensure function name exists
    if (!code.includes('function createGeneratedItem')) {
      code = `function createGeneratedItem(THREE){\n${code}\n}\n`;
    }

    // No filesystem persistence
    return res.json({ code, savedPath: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate Three.js code', details: String(err) });
  }
});

// Optional refine endpoint (stub that forwards instructions)
app.post('/api/refine', async (req, res) => {
  try {
    const { targetImageDataUrl, renderImageDataUrl, currentCode, instructions } = req.body || {};
    if (!targetImageDataUrl || !renderImageDataUrl || !currentCode) {
      return res.status(400).json({ error: 'Missing target/render/currentCode' });
    }

    const toInline = (dataUrl) => {
      const m = dataUrl.match(/^data:(.*?);base64,(.*)$/);
      if (!m) throw new Error('Invalid data URL');
      return { mimeType: m[1], data: m[2] };
    };

    const model = 'gemini-2.5-pro';
    const contents = [
      {
        role: 'user',
        parts: [
          { text: 'Improve the Three.js code so the render matches the target more closely. Return ONLY full function code without markdown.' },
          { text: (instructions && instructions.trim()) ? ('Extra guidance: ' + instructions) : '' },
          { inlineData: toInline(targetImageDataUrl) },
          { text: 'Current render:' },
          { inlineData: toInline(renderImageDataUrl) },
          { text: 'Current code:\n' + currentCode },
        ],
      },
    ];

    const response = await ai.models.generateContent({ model, contents });
    let code = response?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    code = code.replace(/```[a-z]*\n([\s\S]*?)```/gi, '$1').trim();
    if (!code.includes('function createGeneratedItem')) {
      code = `function createGeneratedItem(THREE){\n${code}\n}\n`;
    }

    // No filesystem persistence for refine either
    return res.json({ code, savedPath: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to refine code', details: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`AI server listening on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY not set. Set it in .env to enable AI.');
  }
});

// ===================== ITEM LIBRARY (Persistent JSON) =====================
const LIB_DIR = path.join(process.cwd(), 'assets', 'library');
const LIB_PATH = path.join(LIB_DIR, 'items.json');
ensureDir(LIB_DIR);
if (!fs.existsSync(LIB_PATH)) fs.writeFileSync(LIB_PATH, JSON.stringify({ items: [] }, null, 2), 'utf8');

function readLibrary() {
  try {
    const raw = fs.readFileSync(LIB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { items: [] };
  }
}

function writeLibrary(lib) {
  fs.writeFileSync(LIB_PATH, JSON.stringify(lib, null, 2), 'utf8');
}

// List items
app.get('/api/items', (req, res) => {
  const lib = readLibrary();
  res.json(lib);
});

// Save or update item
app.post('/api/items', (req, res) => {
  let { id, name, category, code, analysis, imageDataUrl, imagePath, createdAt, updatedAt, meta } = req.body || {};
  if (!name || !code) return res.status(400).json({ error: 'Missing name or code' });
  const lib = readLibrary();
  const now = new Date().toISOString();
  // Filesystem persistence disabled; rely on embedded base64
  if (imagePath && typeof imagePath === 'string' && imagePath.startsWith('assets/')) {
    imagePath = null;
  }
  const item = { id: id || `item_${Date.now()}`, name, category: category || 'misc', code, analysis: analysis || null, imageDataUrl: imageDataUrl || null, imagePath: imagePath || null, meta: meta || {}, createdAt: createdAt || now, updatedAt: now };

  const idx = lib.items.findIndex(i => i.id === item.id);
  if (idx >= 0) lib.items[idx] = item; else lib.items.push(item);
  writeLibrary(lib);
  res.json({ ok: true, item });
});

// Get single item
app.get('/api/items/:id', (req, res) => {
  const lib = readLibrary();
  const item = lib.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// Delete item
app.delete('/api/items/:id', (req, res) => {
  const lib = readLibrary();
  const before = lib.items.length;
  lib.items = lib.items.filter(i => i.id !== req.params.id);
  writeLibrary(lib);
  res.json({ ok: true, deleted: before - lib.items.length });
});

// List available images in assets/images (sorted newest first)
app.get('/api/images', (req, res) => {
  // Deprecated: filesystem listing not reliable for your setup.
  // Derive available image dataUrls directly from library for stability.
  const lib = readLibrary();
  const seen = new Set();
  const images = [];
  // Prefer embedded base64
  for (const it of lib.items) {
    if (it.imageDataUrl && !seen.has(it.imageDataUrl)) { seen.add(it.imageDataUrl); images.push(it.imageDataUrl); }
  }
  // Also expose any paths that exist in items (if present)
  for (const it of lib.items) {
    if (it.imagePath && !seen.has(it.imagePath)) { seen.add(it.imagePath); images.push(it.imagePath); }
  }
  res.json({ images });
});


