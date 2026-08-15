# Mosaic Frontend Design System

Welcome! This repository contains the isolated frontend implementation of the Mosaic Web Application, designed specifically for UI/UX designers and frontend developers.

All backend services, API integrations, infrastructure code, and private credentials have been removed and replaced with a clean **local mock data layer** (`src/mock/` & `src/services/`).

## Features

- Complete component library and responsive layout pages
- Interactive modals, dropdowns, forms, tables, and navigation controls
- Theme styles, Tailwind CSS styling, icons, fonts, and animation transitions
- Zero external backend server dependencies
- Local simulated state and demo data for rapid UI prototyping

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher

### Installation

1. Install project dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the Vite local development server:
```bash
npm run dev
```

The application will be served at `http://localhost:5174/`.

### Building for Production

To test the production build bundle:
```bash
npm run build
```

Preview the built static files:
```bash
npm run preview
```

### Code Formatting & Quality

- **Linting**: `npm run lint:check`
- **Formatting**: `npm run format`

## Mock Data Architecture

All interactions (authentication, table updates, form submissions, and user profiles) operate using local mock handlers located in `src/mock/mockData.js` and `src/services/`. You can update mock data or add new visual components without needing any local server or database.
