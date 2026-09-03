# Omarchy Snail

An experimental homepage concept for [Omarchy](https://omarchy.org/), built around the feel of a Hyprland desktop. Seven sections move through a responsive, window-like layout while themes and navigation stay in sync.

[Watch the 29-second demo](./omarchy-demo.mp4)

## Highlights

- Dwindle and scrolling desktop layouts, plus a compact mobile layout
- Tokyo Night, Everforest, Catppuccin, and Nord themes with matching artwork
- Section navigation through the header, workspace switcher, cards, scroll, and URL hashes
- Saved theme and layout preferences, with query-string overrides
- Reduced-motion support and keyboard-accessible controls
- Focused unit tests for the layout geometry

Try a specific presentation directly with URL parameters:

```text
?theme=catppuccin&layout=scrolling
```

Supported themes are `tokyo-night`, `everforest`, `catppuccin`, and `nord`. Supported desktop layouts are `dwindle` and `scrolling`.

## Run locally

You need Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Vite will print the local development URL. To create and inspect a production build:

```bash
npm run build
npm run preview
```

Run the tests with:

```bash
npm test
```

## Project structure

- `index.html` contains the seven sections and accessible navigation.
- `styles.css` defines the visual system, themes, responsive states, and transitions.
- `script.js` coordinates navigation, preferences, themed artwork, and rendering.
- `layouts.js` contains the testable layout calculations.
- `assets/` contains local artwork, type, and video thumbnails.

This is an independent front-end concept and is not the official Omarchy website. Omarchy names, marks, and linked content belong to their respective owners.
