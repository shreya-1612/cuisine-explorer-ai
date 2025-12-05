import React, { useState, useCallback } from "react";
import "./App.css";

// ---- EXISTING CONFIG (kept) ----
console.log("Loaded API Key from .env:", import.meta.env.VITE_GEMINI_API_KEY);

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const model = "models/gemini-2.5-flash"; // text model (used on backend)
const apiUrl = "http://localhost:5000/api/generate"; // your backend

const MAX_RETRIES = 3;

// ---------- helpers ----------
async function fetchWithRetry(url, payload, retries = 0) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 429 && retries < MAX_RETRIES) {
      const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, payload, retries + 1);
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error?.message || `API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("FULL ERROR →", error);
    throw error;
  }
}

// this still calls whatever image endpoint you have
async function generateImage(prompt) {
  const imageUrl = "http://localhost:3000/image"; // <- your image backend

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
Generate a single high-quality image of this dish. 
Return the image in base64 inline_data format.

Dish description: ${prompt}

Make it look appetizing, realistic, restaurant-quality.
No text, no borders, no people.
          `,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(imageUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Image API response →", data);

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
      console.warn("No inline_data image found in the image API response.");
      return null;
    }

    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}

function formatMarkdownToHtml(markdown) {
  let html = markdown.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/^### (.*$)/gim, '<h4 class="ce-h4">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="ce-h3">$1</h3>');
  return html
    .split("\n\n")
    .map((p) => `<p class="ce-p">${p}</p>`)
    .join("");
}

// popular chips just for UX
const POPULAR_INGREDIENTS = [
  "Chicken",
  "Garlic",
  "Onion",
  "Tomatoes",
  "Rice",
  "Pasta",
  "Cheese",
  "Mushrooms",
];

export default function App() {
  const [ingredients, setIngredients] = useState("");
  const [recipeHtml, setRecipeHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recipeImage, setRecipeImage] = useState("");

  const handleAddChip = (chip) => {
    setIngredients((prev) => {
      if (!prev) return chip;
      // avoid duplicate commas
      return prev.trim().endsWith(",")
        ? `${prev} ${chip}`
        : `${prev}, ${chip}`;
    });
  };

  const generateRecipe = useCallback(async () => {
    if (!apiKey) {
      alert("Missing API key! Please check your .env file.");
      return;
    }
    if (!ingredients.trim()) {
      alert("Please enter at least one ingredient.");
      return;
    }

    setIsLoading(true);
    setRecipeImage("");

    const userQuery = `Using these ingredients: ${ingredients}. Create a flavorful recipe.`;
    const systemPrompt = `You are a world-class chef. Format with:
1. Recipe Title
2. Ingredients
3. Instructions
4. Flavor Enhancements
5. YouTube Search Keyword.`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt + "\n\n" + userQuery }],
        },
      ],
    };

    try {
      // text
      const result = await fetchWithRetry(apiUrl, payload);
      console.log("API RESPONSE →", result);
      const text =
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response generated.";
      setRecipeHtml(formatMarkdownToHtml(text));

      // image
      const imagePrompt = `
High-quality, ultra-realistic food photography of the dish described below.
It should look delicious, well-plated, and ready to serve in a restaurant setting.

Dish description: ${ingredients}

Style details:
- Studio lighting, 50mm lens depth-of-field blur
- Natural shadows and highlights
- Top-down or 45° angle shot
- Rich color tones and appetizing textures
- White plate, wooden table, soft background bokeh
- No people, no text overlay, no borders
`;
      const img = await generateImage(imagePrompt);
      if (img) setRecipeImage(img);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [ingredients]);

  return (
    <div className="ce-root">
      {/* Top bar / logo area */}
      <header className="ce-topbar">
        <div className="ce-logo-pill">
          <div className="ce-logo-icon">🍲</div>
          <div className="ce-logo-texts">
            <div className="ce-logo-title">Cuisine Explorer AI</div>
            <div className="ce-logo-subtitle">
              Discover recipes from your ingredients
            </div>
          </div>
        </div>
      </header>

      <main className="ce-main">
        {/* HERO SECTION */}
        <section className="ce-hero">
          <div className="ce-hero-image" />
          <div className="ce-hero-overlay">
            <div className="ce-hero-badge">
              <span className="ce-hero-badge-dot">⚡</span>
              AI-Powered Recipe Generation
            </div>
            <h1 className="ce-hero-title">What&apos;s in your kitchen?</h1>
            <p className="ce-hero-subtitle">
              Enter your ingredients and let AI create delicious recipes just
              for you.
            </p>
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section className="ce-feature-row">
          <article className="ce-feature-card">
            <div className="ce-feature-icon">🍽️</div>
            <h3 className="ce-feature-title">Smart Recipes</h3>
            <p className="ce-feature-text">
              Get personalized recipes based on what you already have.
            </p>
          </article>
          <article className="ce-feature-card">
            <div className="ce-feature-icon">⏱️</div>
            <h3 className="ce-feature-title">Quick &amp; Easy</h3>
            <p className="ce-feature-text">
              Step-by-step instructions for effortless home cooking.
            </p>
          </article>
          <article className="ce-feature-card">
            <div className="ce-feature-icon">✨</div>
            <h3 className="ce-feature-title">AI-Powered</h3>
            <p className="ce-feature-text">
              Discover creative flavor combinations and new ideas.
            </p>
          </article>
        </section>

        {/* INPUT PANEL */}
        <section className="ce-input-wrapper">
          <div className="ce-input-card">
            <div className="ce-input-header">
              <h2 className="ce-input-title">Enter Your Ingredients</h2>
              <p className="ce-input-subtitle">
                e.g. chicken, garlic, butter, lemon...
              </p>
            </div>

            <div className="ce-input-row">
              <textarea
                className="ce-input-textarea"
                rows={2}
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Type or paste ingredients, separated by commas..."
              />
              <button
                type="button"
                className="ce-input-add-btn"
                onClick={generateRecipe}
                disabled={isLoading}
              >
                {isLoading ? "Cooking..." : "Generate"}
              </button>
            </div>

            <div className="ce-chip-section">
              <div className="ce-chip-label">Popular ingredients:</div>
              <div className="ce-chip-row">
                {POPULAR_INGREDIENTS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="ce-chip"
                    onClick={() => handleAddChip(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {!ingredients && !isLoading && (
              <p className="ce-input-hint">
                Add at least one ingredient to generate a recipe.
              </p>
            )}

            <button
              type="button"
              className="ce-main-cta"
              onClick={generateRecipe}
              disabled={isLoading}
            >
              <span className="ce-main-cta-icon">🤖</span>
              {isLoading ? "Cooking with AI..." : "Generate Recipe"}
            </button>
          </div>
        </section>

        {/* RESULT PANEL */}
        <section className="ce-result-section">
          <div className="ce-result-card">
            {recipeImage && (
              <img
                src={recipeImage}
                alt="Generated dish"
                className="ce-result-image"
              />
            )}
            <div
              className="ce-result-content"
              dangerouslySetInnerHTML={{ __html: recipeHtml }}
            />
            {!recipeHtml && !isLoading && (
              <p className="ce-result-placeholder">
                Your AI-crafted recipe will appear here after you generate one.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
