# Frontend README — Vanguard Controls Automation Tool (V-CAT)

This repository contains the user interface, state management, and client-side compliance tracking logic for the Vanguard Controls Automation Tool (V-CAT).

---

## Contents of the Deliverable

### Implemented Features & Architecture

- **Single Page Application Framework:** Built as a modern React SPA optimized for responsive rendering and lightweight compliance control navigation.
- **Authentication Flow Integration:** Out-of-the-box support for AWS Cognito User Pools, handling token-based user sessions, protected routes, and secure access.
- **File Transfer Operations:** Custom interface modules interacting with backend storage endpoints to manage file imports and Excel/CSV tracking sheet exports.
- **Code Standards & Formatting:** Configured build-pipeline linting (ESLint) and deterministic code formatting configurations (Prettier) to ensure collaborative continuity.

### Features Not Implemented (Future Scope)

- **Offline State Persistence:** The application currently requires direct connectivity to the V-CAT API/Cognito endpoints and does not cache modifications or operations locally when offline.
- **Local Cognito Mocking:** The frontend depends entirely on authenticating against cloud-hosted AWS Cognito infrastructure pools during local development.

### Known Open Issues & Workarounds

- **Port Sharing Collisions:** If the backend emulation tool chain accidentally claims port 3000, or if a previous React development server remains hung in the background, executing `npm start` will throw an address-in-use error.
  - _Workaround:_ When prompted by the React CLI stack to shift addresses, type **Y** to transparently re-route the frontend development environment to alternate port `3001`.

---

## Step-by-Step Local Start

Follow these steps to configure and boot the frontend user interface locally:

1. **Clone the repo:** `git clone https://github.com/mhxynh/vcat-frontend.git`
2. **Install dependencies:** `npm install`
3. **Configure Environment**: The frontend uses a `.env` file to handle environment-specific settings (like the API URL). This file is **git-ignored** to prevent local configuration conflicts and credential leakages.
   - `cp .env.example .env`
   - _Open .env and fill in your specific `REACT_APP_USER_POOL_ID` and `REACT_APP_APP_CLIENT_ID` values._
4. **Start the app**: `npm start`
   - Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
   - If the backend (SAM) is already running on port 3000, you will be asked to use another port. Type **Y** to run the frontend on `3001`.

## How to Run a Full Integration Test (BE & FE)

To fully validate Pull Requests impacting cross-origin data flows or end-to-end integration workflows via Docker Compose, set up sibling directories as follows:

```text
vcats/
  vcat-backend/
  vcat-frontend/
```

Navigate into your backend directory and boot the orchestrated network environment:

```bash
cd ../vcat-backend
docker compose up --build
```

Once the containers warm up, the Frontend React App will become fully operational at http://localhost:3000 and link directly to the Backend SAM API listening at http://localhost:3001.

### Manual Multi-Terminal Alternates

If you prefer not to utilize Docker Compose, you can achieve the same operational stack by launching separate terminal windows:

1. **Terminal 1 (Backend):** `sam local start-api` (keep this running)
2. **Terminal 2 (Frontend):** `npm start`
3. **Verify:** Check the browser; if the UI says `"Error fetching data"`, ensure Terminal 1 hasn't crashed.

## Production

To verify the app is ready for deployment:

1. Run `npm run build`.
2. If the build succeeds, the project is ready for AWS hosting.
3. To preview the production build locally: `npx serve -s build`.

## Available Development Scripts

The following scripts can be executed within this repository directory:

`npm start` - Runs the app in development mode. The page will reload if you make edits. You will see any lint errors in the console.\
`npm run build` - Builds the app for production to the build folder. It correctly bundles React in production mode for the best performance.\
`npm run lint` - Runs ESLint to check for naming and code quality issues.\
`npm run format` - Runs Prettier to fix code formatting automatically.
