# 親子歡樂西洋棋 (WestChess)

A family chess game that runs in the browser and installs as a PWA (works offline after the first visit).

Play: https://heygothisway.github.io/WestChess/

## Install

- **Android (Chrome):** open the link → menu ⋮ → *Install app* / *Add to Home screen*.
- **iPhone/iPad (Safari):** open the link → Share → *Add to Home Screen*.
- **Desktop (Chrome/Edge):** click the install icon in the address bar.

Open it once online so assets are cached; after that it works offline.

## Develop

Static files only. Serve locally with `python -m http.server 8080` and open http://localhost:8080 (service workers need localhost or HTTPS).
Bump `CACHE` in `sw.js` when releasing changes. GitHub Pages serves the `main` branch root, so merging to `main` publishes.

