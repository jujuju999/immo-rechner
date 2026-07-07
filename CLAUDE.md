# Immobilien-Rendite-Rechner

## Zweck

Interaktiver Lern- und Überschlagsrechner für Immobilien-Investments:

- Brutto-/Nettomietrendite
- Cashflow pro Monat, vor und nach Steuer
- Hebel-Effekt (Objektrendite vs. Eigenkapitalrendite)
- AfA & Steuerwirkung (Grenzsteuersatz, Gebäudeanteil, AfA-Satz)
- Vermögensaufbau über die Haltedauer inkl. Tilgungsverlauf-Chart

Vereinfachtes Modell (lineare AfA, keine Zinsbindungs-Änderung, kein Mietausfall) —
kein Ersatz für Steuerberatung.

## Tech-Stack

- **Vite 8** + **React 19** (JavaScript, `.jsx`)
- **Tailwind CSS 4** über das Vite-Plugin `@tailwindcss/vite` — keine `tailwind.config.js`,
  eingebunden per `@import "tailwindcss";` in `src/index.css`
- **recharts** für das Tilgungsverlauf-Chart
- Die gesamte Rechenlogik und UI liegt in `src/ImmoRechner.jsx` (eine Komponente,
  Zahlenformatierung de-DE, Inline-Styles + wenige Tailwind-Utilities)

## Befehle

```bash
npm run dev      # Dev-Server (lokal)
npm run build    # Produktions-Build nach dist/
npm run deploy   # Build + Veröffentlichung auf GitHub Pages
```

## Deployment (GitHub Pages)

- Live-URL: https://jujuju999.github.io/immo-rechner/
- Repo: https://github.com/jujuju999/immo-rechner
- `npm run deploy` baut die App und pusht `dist/` per `gh-pages`-Paket auf den
  Branch `gh-pages`, den GitHub Pages ausliefert.
- **Wichtig:** `base: '/immo-rechner/'` in `vite.config.js` muss dem Repo-Namen
  entsprechen. Ohne korrekte `base` lädt die Seite ihre Assets nicht (weiße Seite).
- Quellcode-Änderungen zusätzlich normal auf `main` pushen — der `gh-pages`-Branch
  enthält nur Build-Artefakte.
