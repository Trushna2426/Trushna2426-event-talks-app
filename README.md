# Google BigQuery Release Notes Viewer & Tweet Composer

A modern, high-fidelity web application built with **Python Flask** and **plain vanilla HTML, CSS, and JavaScript** that parses the official Google Cloud BigQuery Release Notes feed, enabling users to explore updates, search/filter content, copy code blocks, and instantly share formatted updates to Twitter/X under the 280-character limit.

## 🚀 Live Demo & Interface

The application features a sleek dark-mode-by-default interface with glassmorphism design cards, responsive alignments, and custom theme switches.

*   **API Caching**: Integrated 30-minute backend cache to load updates instantly while supporting manual refresh.
*   **Tweet intent composer**: Formats, truncates, and links release notes to draft tweets automatically.

---

## 🛠️ Tech Stack

*   **Backend**: Python, Flask, Requests, Standard Library `html.parser.HTMLParser`
*   **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Properties, Flexbox/Grid, Glassmorphism, Animations), Vanilla ES6 JavaScript (AJAX, Debouncing, DOM events)
*   **Integrations**: Twitter/X Web Share Intent API

---

## ✨ Key Features

1.  **Atom Feed Parsing & Separation**:
    Instead of rendering feed items as single massive days, the backend parser extracts individual update categories (e.g., `Feature`, `Issue`, `Announcement`, `Deprecation`) and serves them as discrete queryable cards.
2.  **Server-Side Feed Caching**:
    Caches the feed in memory for 30 minutes to reduce feed loading times. Bypassed automatically when clicking the **Refresh** button to pull fresh XML.
3.  **Real-Time Search & Filtering**:
    *   Filter by type: *All*, *Features*, *Issues*, *Announcements*, *Deprecations*.
    *   Debounced search matches text across title dates, tags, and paragraph body contents.
4.  **Premium Twitter Preview Composer**:
    Clicking **Select & Tweet** on any card opens a custom preview dialog:
    *   Calculates character limits (max 280) dynamically.
    *   Automatically truncates the middle description text to fit prefix (`📢 BigQuery [Type] (Date):`) and suffix (`#BigQuery #GCP`) hashtags.
    *   Allows manual editing before launching the Twitter post window.
5.  **Interactive Code Blocks**:
    All code listings (inline `code` and multiline `pre`) feature a dynamic copy-to-clipboard button.
6.  **Dual Theme Toggle**:
    Seamless dark and light modes, persisting the user's preference in browser `localStorage`.

---

## 🏃 Getting Started & Installation

### Prerequisites
Make sure you have Python 3.7+ installed.

### 1. Clone & Navigate to Project Directory
```bash
git clone https://github.com/Trushna2426/Trushna2426-event-talks-app.git
cd Trushna2426-event-talks-app
```

### 2. Install Dependencies
The application relies on Flask and Requests. You can install them via pip:
```bash
pip install Flask requests
```

### 3. Run the Server
Launch the Flask development server:
```bash
python app.py
```

### 4. Open the Web Application
Open your web browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📂 Project Structure

```
bigquery-release-notes-viewer/
│
├── app.py                  # Flask routes, Atom XML fetching, custom HTML Parser, and cache logic
├── README.md               # Documentation
├── .gitignore              # Git ignore rules
│
├── templates/
│   └── index.html          # Main HTML structure, SVG icons, and Twitter modal
│
└── static/
    ├── css/
    │   └── style.css       # Layout styles, theme toggles, animations, and typography
    └── js/
        └── main.js         # AJAX fetching, search/filter handlers, and character counters
```

---

## 🛡️ License

This project is licensed under the MIT License - see the LICENSE file for details.
