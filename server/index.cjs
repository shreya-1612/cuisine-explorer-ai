// server/index.cjs
const express = require("express");
const cors = require("cors");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config({ path: "../.env" }); // read API key from root .env

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation";

if (!API_KEY) {
  console.warn("⚠️ No GEMINI API key found in .env");
}

// ---------- TEXT RECIPE ENDPOINT ----------
app.post("/api/generate", async (req, res) => {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/${TEXT_MODEL}:generateContent?key=${API_KEY}`;

    const googleRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body), // forward payload from frontend
    });

    const data = await googleRes.json();

    if (!googleRes.ok) {
      console.error("Text API error:", data);
      return res.status(googleRes.status).json({ error: data.error });
    }

    res.json(data);
  } catch (err) {
    console.error("Server /api/generate error:", err);
    res.status(500).json({ error: { message: "Server error while generating recipe" } });
  }
});

// ---------- IMAGE ENDPOINT ----------
app.post("/api/image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
Generate a single high-quality image of this dish.
Return the image as base64 inline_data (PNG only).

Dish description:
${prompt}

Make it realistic, restaurant-quality, no text, no people, no borders.
              `,
            },
          ],
        },
      ],
    };

    const url = `https://generativelanguage.googleapis.com/v1/models/${IMAGE_MODEL}:generateContent?key=${API_KEY}`;

    const googleRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await googleRes.json();
    console.log("🖼️ Image API response →", data);

    if (!googleRes.ok) {
      console.error("Image API error:", data);
      return res.status(googleRes.status).json({ error: data.error });
    }

    let base64Image = null;
    if (data?.candidates?.length) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inline_data?.data) {
          base64Image = part.inline_data.data;
          break;
        }
      }
    }

    if (!base64Image) {
      console.warn("No inline_data image found in Gemini response.");
      return res.status(500).json({ error: { message: "No image returned from Gemini" } });
    }

    // send a simple JSON with the data URL
    res.json({ image: `data:image/png;base64,${base64Image}` });
  } catch (err) {
    console.error("Server /api/image error:", err);
    res.status(500).json({ error: { message: "Server error while generating image" } });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
