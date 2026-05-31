# Frontend README

This repository contains the user interface and client-side logic for the Vanguard Controls Automation Tool (V-CAT).

## Step-by-Step Local Start

1. **Clone the repo:** `git clone https://github.com/mhxynh/vcat-frontend.git`
2. **Install dependencies:** `npm install`
3. **Configure Environment**: The frontend uses a `.env` file to handle environment-specific settings (like the API URL). This file is **git-ignored** to prevent local configuration conflicts.
   - `cp .env.example .env`
4. **Start the app**: `npm start`
   - Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
   - If the backend (SAM) is already running on port 3000, you will be asked to use another port. Type **Y** to run the frontend on `3001`.

## How to Run a Full Test (BE & FE)

To test a PR that affects data flow with Docker, clone the frontend and backend repositories as siblings and run compose from the backend repository:

```text
vcats/
  vcat-backend/
  vcat-frontend/
```

```bash
cd ../vcat-backend
docker compose up --build
```

The frontend will be available at [http://localhost:3000](http://localhost:3000), and the backend API will be available at [http://localhost:3001](http://localhost:3001).

You can still run the repositories manually in separate terminals:

1. **Terminal 1 (Backend):** `sam local start-api` (keep this running)
2. **Terminal 2 (Frontend):** `npm start`
3. **Verify:** Check the browser; if the UI says "Error fetching data," ensure Terminal 1 hasn't crashed.

## Production

To verify the app is ready for deployment:

1. Run `npm run build`.
2. If the build succeeds, the project is ready for AWS hosting.
3. To preview the production build locally: `npx serve -s build`.

## Available Scripts

`npm start` - Runs the app in development mode. The page will reload if you make edits. You will see any lint errors in the console.\
`npm run build` - Builds the app for production to the build folder. It correctly bundles React in production mode for the best performance.\
`npm run lint` - Runs ESLint to check for naming and code quality issues.\
`npm run format` - Runs Prettier to fix code formatting automatically.
