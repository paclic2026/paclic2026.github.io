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
├── index.html              # Home page
├── cfp.html                # Call for Papers
├── speakers.html           # Keynote Speakers
├── venue.html              # Venue & Travel
├── css/
│   └── style.css           # Full stylesheet with CSS custom properties
├── js/
│   ├── main.js             # Scroll-spy, countdown timers, mobile nav, tabs
│   └── chat-widget.js      # Floating AI assistant chat widget
├── images/                 # Photos and graphics
├── kb.txt                  # AI chatbot knowledge base (fetched at runtime)
├── system-prompt.txt       # AI chatbot system instruction (fetched at runtime)
├── PACLIC_40_Call_for_Papers.pdf
├── PACLIC2026_Poster.pdf
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
| Pre-conference workshops | December 9–10, 2026 |
| Main conference | December 10–12, 2026 |

## Contact

📧 [paclic2026@gmail.com](mailto:paclic2026@gmail.com)

---

## Image Credits

All photos are used under their respective free-use licences.

| # | Description | Photographer | Source |
|---|---|---|---|
| 1 | Taipei City at sunset | Timo Volz (May 21, 2021) | [Unsplash](https://unsplash.com/photos/high-rise-building-during-sunset-9-JFZIORoRw) — Unsplash License |
| 2 | National Taiwan University (NTU) | Yu Chen Lin 育辰 (Jan 21, 2023) | [Unsplash](https://unsplash.com/photos/a-group-of-people-walking-down-a-street-next-to-palm-trees-I1fH1nAt5GY) — Unsplash License |
| 3 | White oriental memorial archway in sunny day, Taipei | Yuan Hang Chen | [Pexels](https://www.pexels.com/photo/white-oriental-memorial-archway-in-sunny-day-4095421/) — Pexels License |
| 4 | Raohe Night Market, Taipei, Taiwan | Vernon Raineil Cenzon (Mar 19, 2019) | [Unsplash](https://unsplash.com/photos/group-of-people-on-china-town-6rEPAbrXNaY) — Unsplash License |
| 5 | Jiufen Taiwan teahouse / Chinese architecture | Ricky LK (Mar 1, 2023) | [Unsplash](https://unsplash.com/photos/a-row-of-buildings-with-red-lanterns-hanging-from-them-Cj72lAv4nMw) — Unsplash License |
| 6 | Aerial view of illuminated skyscrapers in Taipei, Taiwan | Jimmy Liao | [Pexels](https://www.pexels.com/photo/aerial-view-illuminated-skyscrapers-in-taipei-taiwan-16705995/) — Pexels License |

---

## Technical Development

Website development and AI chatbot integration by **Jessica Thach-Thao Le**, Graduate Student, Graduate Institute of Linguistics, National Taiwan University.

For technical issues with the website, please open a GitHub issue or contact [jessie.thachthao@gmail.com](mailto:jessie.thachthao@gmail.com).
For conference-related inquiries (program, submissions, registration), please contact [paclic2026@gmail.com](mailto:paclic2026@gmail.com).

---

*Built for PACLIC 40 Organising Committee — Graduate Institute of Linguistics, National Taiwan University.*
