# AI Resume Generator (React + Node + Express + MongoDB)

A full-stack web application that lets users sign up, log in, generate AI-written resumes, and view resume history.

## Tech Stack

- Frontend: React, React Router, Axios, Tailwind CSS, Vite
- Backend: Node.js, Express, JWT auth, bcrypt password hashing
- Database: MongoDB with Mongoose
- AI: OpenAI API

## Project Structure

```text
resume.app/
+-- backend/
¦   +-- config/
¦   ¦   +-- db.js
¦   +-- controllers/
¦   ¦   +-- authController.js
¦   ¦   +-- resumeController.js
¦   +-- middleware/
¦   ¦   +-- authMiddleware.js
¦   +-- models/
¦   ¦   +-- Resume.js
¦   ¦   +-- User.js
¦   +-- routes/
¦   ¦   +-- authRoutes.js
¦   ¦   +-- resumeRoutes.js
¦   +-- .env.example
¦   +-- package.json
¦   +-- server.js
+-- frontend/
¦   +-- src/
¦   ¦   +-- api/
¦   ¦   ¦   +-- axiosInstance.js
¦   ¦   +-- components/
¦   ¦   ¦   +-- Navbar.jsx
¦   ¦   ¦   +-- ProtectedRoute.jsx
¦   ¦   +-- pages/
¦   ¦   ¦   +-- Dashboard.jsx
¦   ¦   ¦   +-- History.jsx
¦   ¦   ¦   +-- Home.jsx
¦   ¦   ¦   +-- Login.jsx
¦   ¦   ¦   +-- Signup.jsx
¦   ¦   +-- App.jsx
¦   ¦   +-- index.css
¦   ¦   +-- main.jsx
¦   +-- .env.example
¦   +-- index.html
¦   +-- package.json
¦   +-- postcss.config.js
¦   +-- tailwind.config.js
¦   +-- vite.config.js
+-- .gitignore
+-- README.md
```

## Features

- User signup and login with JWT token authentication
- Password hashing with bcrypt
- Protected routes for resume generation and history
- OpenAI-powered resume generation from user input
- Resume history saved in MongoDB with timestamps
- Responsive professional UI using Tailwind CSS

## Backend Setup

1. Navigate to backend:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` from example and update values:

```bash
cp .env.example .env
```

Required backend environment variables:

- `PORT=5000`
- `MONGO_URI=mongodb://127.0.0.1:27017/ai_resume_app`
- `JWT_SECRET=your_long_random_secret`
- `OPENAI_API_KEY=your_openai_api_key`
- `CLIENT_URL=http://localhost:5173`

4. Start backend:

```bash
npm run dev
```

Backend runs at `http://localhost:5000`.

## Frontend Setup

1. Navigate to frontend:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` from example:

```bash
cp .env.example .env
```

Required frontend environment variable:

- `VITE_API_URL=http://localhost:5000/api`

4. Start frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

## API Endpoints

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`

### Resume

- `POST /api/resumes/generate` (Protected)
- `GET /api/resumes/history` (Protected)

Protected endpoints require header:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Deployment

### Deploy Backend (Railway)

1. Push project to GitHub.
2. Create a new Railway project and select the backend folder.
3. Set environment variables in Railway:
   - `PORT`
   - `MONGO_URI` (use MongoDB Atlas connection string for production)
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - `CLIENT_URL` (your Vercel frontend URL)
4. Deploy and copy the backend URL, e.g. `https://your-app.up.railway.app`.

### Deploy Frontend (Vercel)

1. Import repository in Vercel.
2. Set root directory to `frontend`.
3. Add environment variable:
   - `VITE_API_URL=https://your-app.up.railway.app/api`
4. Deploy and open the generated Vercel URL.

## Production Notes

- Use MongoDB Atlas in production.
- Use a strong random `JWT_SECRET`.
- Keep `.env` files private and never commit secrets.
- Update CORS `CLIENT_URL` to your deployed frontend URL.

## License

MIT

## Free AI Mode (Ollama)

You can run free local AI generation with Ollama instead of OpenAI API.

1. Install Ollama from `https://ollama.com/download`.
2. Pull a model:

```bash
ollama pull llama3.2
```

3. Start Ollama (it serves at `http://127.0.0.1:11434` by default).
4. In `backend/.env` use:

```env
OPENAI_API_KEY=replace_with_openai_api_key
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

5. Restart backend and verify `GET /api/health` returns `"aiMode":"ollama"`.

## Free Deployment (Recommended)

### 1) Backend on Render (Free)

1. Push code to GitHub.
2. In Render, create a new Web Service from your repo.
3. Use:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables:
   - `PORT=5000`
   - `MONGO_URI=...`
   - `JWT_SECRET=...`
   - `CLIENT_URL=https://<your-vercel-domain>`
   - `OPENAI_API_KEY=replace_with_openai_api_key` (or keep Ollama for local)
5. Deploy and copy backend URL.

### 2) Frontend on Vercel (Free)

1. Import repo in Vercel.
2. Set project root to `frontend`.
3. Add env:
   - `VITE_API_URL=https://<your-render-backend>/api`
4. Deploy.

### 3) MongoDB Atlas (Free Tier)

1. Create M0 cluster.
2. Add DB user.
3. Allow network access (for test: `0.0.0.0/0`).
4. Put Atlas URI in backend `MONGO_URI`.

## PWA Install (No Play Store Needed)

PWA support is already added:

- `frontend/public/manifest.webmanifest`
- `frontend/public/sw.js`
- Install button in navbar (`Install App`)

How to use:
1. Open deployed app in Chrome/Edge.
2. Click `Install App` in navbar.
3. App installs like mobile app shortcut.

## APK Build (Without Play Store)

Use Capacitor to make an installable APK locally:

1. Build frontend:
```bash
cd frontend
npm install
npm run build
```

2. Install Capacitor:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init manal.cv com.manal.cv --web-dir=dist
```

3. Add Android platform:
```bash
npx cap add android
npx cap sync android
```

4. Open Android Studio:
```bash
npx cap open android
```

5. In Android Studio:
- Build > Generate Signed Bundle / APK
- Choose APK
- Create keystore (first time)
- Generate release APK

APK output (usually):
`frontend/android/app/build/outputs/apk/release/app-release.apk`

You can share this APK directly on WhatsApp/Drive.
