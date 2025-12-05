🍽️ Cuisine Explorer AI
AI-powered recipe generation based on ingredients you already have!
Cuisine Explorer AI is a full-stack application that intelligently generates personalized recipes and food images using Google Gemini models.
Users can enter available ingredients, and the system returns a complete recipe—including title, ingredients, instructions, flavor enhancements, and a suggested YouTube search keyword—along with an AI-generated food image.

This project demonstrates modern UI/UX design, backend API engineering, prompt engineering, and seamless full-stack AI integration.

 Features:
AI-powered recipe creation using Google Gemini 2.5 Flash
Ultra-realistic food image generation
Modern, responsive UI inspired by a custom Figma design
Ingredient recommendation chips for improved UX
Retry & error-handled fetch logic
Secure backend routing to protect API keys
Animation-enhanced user experience
Modular, production-ready codebase

Tech Stack:
Frontend:
React (Vite)
TailwindCSS / Custom CSS
JavaScript (ES6+)

Backend:
Node.js
Express.js
dotenv for secure environment variables
Google Gemini API for Text and Image Models

Project Structure:

cuisine-explorer/
│
├── server/               # Backend
│   ├── index.cjs         # Express server + Gemini API routing
│   ├── package.json
│   └── .env
│
├── src/                  # React Frontend
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── assets/
│
├── .env                  # Frontend env file
├── package.json
├── vite.config.js
└── README.md
