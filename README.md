# 이웃점빵 React (`myeongji2`)

React + Vite front end for the existing neighborhood stores API.

## Local development

```sh
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in a local `.env` file to override the current API address. This value is public client configuration; do not put database credentials or private API keys in `VITE_*` variables.

## Build and GitHub Pages

The Vite base path is `/myeongji2/`, matching `https://tobyul.github.io/myeongji2/`. Pushes to `main` build `dist/` and deploy it with GitHub Actions. In repository Settings → Pages, select **GitHub Actions** as the source. The published Pages site is public even when the source repository is private; private Pages access requires GitHub Enterprise Cloud.

This project uses hash-based client navigation so direct navigation and refresh work on GitHub Pages without server rewrite rules. The current legacy `myeongji` site and its URL are not changed by this project.

## API security follow-up

The public front end sanitizes rich text again before display. The API should also sanitize rich text at write time and enforce upload authentication and event ownership checks server-side. Client-side checks are not a substitute for API authorization.
