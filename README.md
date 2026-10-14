# To-Do List Life Dashboard

A clean, modern productivity dashboard built with pure HTML, CSS, and Vanilla JavaScript, designed for deployment on GitHub Pages.

## Features
- **Real-time Clock & Date**: Live clock display with 12h/24h toggle, current date, and dynamic time-of-day greeting (*Good Morning*, *Good Afternoon*, *Good Evening*, *Good Night*).
- **Focus Timer (Pomodoro)**: 25-minute timer with Start, Stop, and Reset controls, visual progress track, today's session counter, and a built-in Web Audio completion chime.
- **To-Do List**: Add tasks, inline edit tasks, toggle completion status, delete tasks, and automatically persist data to browser `localStorage`.
- **Quick Links**: Quick launcher chips for favorite websites (Google, Gmail, Calendar, etc.) with custom add/delete support.
- **5 Challenges Implemented**:
  1. Light / Dark mode toggle with persistent state.
  2. Custom greeting name customization.
  3. Configurable Pomodoro duration (presets 15m, 25m, 45m, 50m, plus custom duration).
  4. Duplicate task prevention with inline warning.
  5. Task sorting (Newest, Oldest, Alphabetical A-Z, Incomplete First).

---

## How to Deploy to GitHub Pages (`github.io`)

### Method 1: Direct Branch Deployment (Recommended & Easiest)
Because this project uses vanilla HTML, CSS (`css/style.css`), and JavaScript (`js/app.js`) with relative paths:

1. Push your project files to your GitHub repository:
   ```bash
   git add .
   git commit -m "Build To-Do List Life Dashboard"
   git push origin main
   ```
2. On your GitHub repository page:
   - Click on **Settings** (gear icon at top).
   - In the left sidebar, click on **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Under **Branch**, select **`main`** (or `master`) and directory **`/ (root)`**.
   - Click **Save**.
3. Within 1-2 minutes, your website will be live at:
   `https://<your-username>.github.io/<your-repo-name>/`

### Method 2: GitHub Actions (Optional for CI/CD)
The project also includes a `.github/workflows/deploy.yml` workflow if you prefer automated deployment via GitHub Actions.

---

## Folder Structure
```text
├── index.html          # Main HTML structure
├── css/
│   └── style.css       # Complete stylesheet (responsive, light/dark mode)
├── js/
│   └── app.js          # Pure vanilla JS (Clock, Pomodoro, Tasks, Links, LocalStorage)
├── .kiro/              # Kiro specifications & checklist for course submission
└── .nojekyll           # Ensures GitHub Pages serves all assets and hidden folders
```
