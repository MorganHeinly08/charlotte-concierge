# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Charlotte Concierge is a static Next.js web application serving as a concierge service guide for Charlotte, NC. The project is configured for static export to GitHub Pages.

## Common Commands

### Development
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build the application for production
npm run export       # Export static site (Note: use 'build' instead - 'export' is deprecated)
```

### Build Process
- Next.js 14 automatically exports static sites when `output: 'export'` is set in next.config.js
- The build command handles both building and exporting
- Static files are output to the `.next` directory

## Architecture

### Next.js Configuration
- **Static Export Mode**: Configured with `output: 'export'` for GitHub Pages deployment
- **Base Path**: `/charlotte-concierge` in production (GitHub Pages repository path)
- **Asset Prefix**: `/charlotte-concierge/` in production
- **Images**: Unoptimized for static export compatibility

### Styling System
- **Tailwind CSS**: Primary styling framework
- **IBM Carbon Design Influence**: Uses IBM Plex Sans font and IBM blue color palette
  - `ibm-blue`: #0f62fe
  - `ibm-cyan`: #1192e8
- **Global Styles**: Located in `src/styles/globals.css`

### Project Structure
```
src/
├── pages/           # Next.js pages (file-based routing)
│   ├── _app.js     # App wrapper component
│   └── index.js    # Homepage
└── styles/
    └── globals.css  # Global styles with Tailwind directives
```

### Key Technical Details
- React 18 with Next.js 14
- Static site generation (no server-side rendering)
- Tailwind configured to scan `src/pages/**` and `src/components/**`
- IBM Plex Sans loaded via Google Fonts CDN