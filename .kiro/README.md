# Kiro Project Specification & Checklist

## Project: To-Do List Life Dashboard
- **Course**: 5-day Software Engineering Coding Camp
- **Batch Date**: 24 August 2026

## Implemented Architecture
- **Structure**: Vanilla HTML5 (`index.html`)
- **Styling**: Single CSS file (`css/style.css`)
- **Logic**: Single Vanilla JavaScript file (`js/app.js`)
- **Storage**: Browser `localStorage` API (zero backend server required)

## Completed MVP Requirements
- [x] **Greeting**: Real-time clock (HH:MM:SS), formatted date, time-of-day greeting (Morning/Afternoon/Evening/Night)
- [x] **Focus Timer**: 25-minute Pomodoro timer, Start, Stop, Reset, Web Audio completion chime
- [x] **To-Do List**: Add task, inline Edit task, Checkbox to toggle Done, Delete task, LocalStorage sync
- [x] **Quick Links**: Add website shortcut, open in new tab, Delete link, LocalStorage sync

## Completed Challenges (All 5 Implemented)
- [x] **Light / Dark mode**: Modern theme switcher with smooth transition & localStorage persistence
- [x] **Custom name in greeting**: Editable name displayed in "Good Morning, [Name]"
- [x] **Change Pomodoro time**: 15m, 25m, 45m, 50m presets + custom minute duration dialog
- [x] **Prevent duplicate tasks**: Case-insensitive duplicate detection with visual warning
- [x] **Sort tasks**: Newest, Oldest, A-Z Alphabetical, and Incomplete-First sorting options
