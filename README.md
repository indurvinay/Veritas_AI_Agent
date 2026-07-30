<p align="center">
  <img src="docs/images/veritas_ai_logo.png" alt="Veritas AI Logo" width="160" />
</p>

# Veritas AI — Personal Google Workspace AI Command Center

Veritas AI is a secure, high-performance personal AI command center that integrates directly with Google Workspace (Gmail, Calendar, Drive, Sheets) to give you an intelligent, unified dashboard and conversational controller. 

Styled with premium cyberpunk glassmorphism aesthetics, it functions as an autonomous, conversational agent (using Gemini 2.5 Flash) that can execute multi-step workspace queries, schedule events, draft replies, and analyze your productivity metrics.

---

## 🚀 Key Features (High-Value Recruiter Appeal)

### 📊 1. AI-Driven Visual Analytics Dashboard
<p align="center">
  <img src="docs/images/veritas_ai_dashboard.png" alt="Veritas AI Dashboard Mockup" width="650" />
</p>

* **Dynamic Workspaces Diagnostics**: Computes real-time workspace metrics on login.
* **Custom SVG Charts (Zero Dependencies)**: Displays interactive, responsive SVG Donut and Bar charts of inbox categorization distribution (Job-Related, Personal, Promos, Spam) and top active senders.
* **⚡ AI Productivity Briefings**: A direct pipeline that feeds active workspace metrics to Gemini to generate witty diagnostic briefings and workflow suggestions in Veritas AI’s voice.

### 🔍 2. Google-Style Cross-App Global Search
* **Parallel Query Engine**: Performs parallel async lookups (`Promise.allSettled`) across Gmail body content, Google Calendar events, and Google Drive files.
* **Centered Global Search Input**: A centered search bar in the header that displays categorized results on typing (debounced).

### 🎙️ 3. Voice Search Agent
* **Web Speech API Integration**: Hands-free voice interface in the chat panel with real-time transcription, red recording pulses, and an animated voice waveform. Auto-sends the request to Veritas AI on silence.

### 📝 4. Smart AI Email Draft Assistant with Tone Adjustments
* **Interactive Composer**: Click **Compose with AI** to write notes, select a tone (*Professional, Concise, Witty, Apologetic, Direct*), and let Gemini polish and refine your draft before sending.

### 📊 5. Fully Interactive Sheets Panel
* **Inline Cell Editing**: Double-click any table cell to edit it inline, saving it directly to Google Sheets with Enter/blur. Includes a "Clear Sheet" utility.

---

## 🛠️ Architecture & Tech Stack

* **Frontend**: React (Vite), Tailwind CSS, TanStack Query, Framer Motion/Motion, Lucide Icons.
* **Backend**: Node.js, Express, Socket.io (real-time Cron alerts), Google APIs Node.js Client, lowdb (JSON memory persistence).
* **AI Model**: Gemini 2.5 Flash (`@google/genai` SDK).

---

## 🔑 Environment Variables (.env)

Create a `.env` file inside the `backend/` directory with the following variables:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/oauth2callback

# Google Sheets Logging Config
GOOGLE_SHEET_ID=your_google_spreadsheet_id
GOOGLE_SHEET_NAME=your_sheet_tab_name (e.g., Sheet1)

# Express Session Encryption
SESSION_SECRET=your_random_string_secret
```

---

## 📦 Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repository-link>
   cd veritas-ai
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

3. **Run in development mode**:
   ```bash
   npm run dev
   ```
   * Backend runs at `http://localhost:5000`
   * Frontend runs at `http://localhost:5173` (with Vite Proxy configured to route requests to backend).

---

## 🌐 Production Build & Deployment

Veritas AI is configured to compile the React frontend and serve it statically from the Express backend in production. This allows you to host the entire app on a single server port (e.g. Render, Railway, or Heroku).

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

### Deploying to Render / Cloud Platforms:

1. **Service Configuration on Render**:
   * **Environment**: Node
   * **Root Directory**: Leave blank (project root)
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`

2. **Environment Variables (Render Environment Tab)**:
   * `NODE_ENV` = `production`
   * `GEMINI_API_KEY` = `your_gemini_api_key`
   * `GOOGLE_CLIENT_ID` = `your_google_client_id`
   * `GOOGLE_CLIENT_SECRET` = `your_google_client_secret`
   * `GOOGLE_REDIRECT_URI` = `https://<your-app-name>.onrender.com/oauth2callback`
   * `GOOGLE_SHEET_ID` = `your_google_sheet_id`
   * `GOOGLE_SHEET_NAME` = `your_sheet_tab_name`
   * `SESSION_SECRET` = `your_session_secret`

3. **Google Cloud Console Settings (OAuth 2.0 Credentials)**:
   * Go to **Google Cloud Console** > **APIs & Services** > **Credentials** > Edit your **OAuth 2.0 Client ID**.
   * Under **Authorized JavaScript origins**, add:
     `https://<your-app-name>.onrender.com`
   * Under **Authorized redirect URIs**, add:
     `https://<your-app-name>.onrender.com/oauth2callback`
   * Click **Save**.

4. **Redeploy**:
   * Trigger a **Clear Cache & Deploy** on Render.
   * Access `https://<your-app-name>.onrender.com` in your browser. Both Google OAuth login and Demo Mode will work seamlessly!
