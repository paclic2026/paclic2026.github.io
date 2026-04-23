# PACLIC 40 — Official Conference Website

**The 40th Pacific Asia Conference on Language, Information and Computation**
📍 Taipei, Taiwan · 🗓 December 10–12, 2026
🏛 Hosted by the Graduate Institute of Linguistics, National Taiwan University

---

## Overview

This is the official static website for PACLIC 40, built as a single-page application with a fixed sidebar navigation, smooth scroll-spy, and a Taiwan national flag–inspired color theme (red, blue, white, and gold).

## Project Structure

```
PACLIC Web/
├── index.html        # Main HTML — all sections in one file
├── css/
│   └── style.css     # Full stylesheet with CSS custom properties
├── js/
│   └── main.js       # Scroll-spy, countdown timers, mobile nav, tabs
└── README.md
```

## Sections

| Section | Description |
|---|---|
| **Home** | Hero with Taipei cityscape photo, CTA buttons, countdown timer |
| **Program** | Pre-conference workshops + day-by-day schedule tabs (Dec 10–12) |
| **Keynote Speakers** | Speaker cards (TBA placeholders) |
| **Call for Papers** | Submission topics, formatting guidelines, important dates |
| **Registration** | Fee table with early-bird / standard / student tiers |
| **Venue & Travel** | Conference venue, accommodation, travel info |
| **Committee** | Organizing and program committee members |
| **FAQ** | Frequently asked questions accordion |
| **Sponsors** | Sponsorship enquiry CTA |

## Design

- **Color theme** — Taiwan national flag: red `#FE0000`, blue `#000095`, white `#FFFFFF`, gold `#D4920A`
- **Fonts** — Source Serif 4 (headings) · Source Sans 3 (body) via Google Fonts
- **Hero photo** — Taipei 101 sunset cityscape (Pexels, free licence, photo ID `6138797`)
- **Sidebar decoration** — Taiwan island map silhouette with Taipei marker
- **Layout** — Fixed 275px sidebar + scrollable main content; fully responsive (mobile hamburger menu)

## Features

- Scroll-spy active nav highlighting via `IntersectionObserver`
- Animated countdown ring for submission / early-bird / conference deadlines
- Day-tab schedule switcher (Dec 10 / 11 / 12)
- FAQ accordion (expand/collapse)
- Mobile-responsive with hamburger menu
- Reveal-on-scroll animations
- Back-to-top button

## Running Locally

No build step required — pure HTML/CSS/JS.

```bash
# Option 1: Python (built-in)
python3 -m http.server 8080

# Option 2: Node (if installed)
npx serve .
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

## Key Dates (2026)

| Event | Date |
|---|---|
| Paper submission deadline | August 1, 2026 |
| Pre-conference workshops | December 9–10, 2026  |
| Main conference | December 10–12, 2026 |

## Contact

📧 [paclic40@gmail.com](mailto:paclic40@gmail.com)

---

*Built for PACLIC 40 Organising Committee — Graduate Institute of Linguistics, National Taiwan University.*
