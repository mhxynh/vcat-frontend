# Frontend README
This repository contains the user interface and client-side logic for the Vanguard Controls Automation Tool (V-CAT).

## Step-by-Step Local Start
1. **Clone the repo:** `git clone https://github.com/mhxynh/vcat-frontend.git`
2. **Install dependencies:** `npm install`
3. **Configure Environment**: Create a file named `.env` in the root directory and add the following:
    ```
    REACT_APP_API_URL=http://127.0.0.1:3000
    ```
4. **Start the app**: `npm start`
    - Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
    - If the backend (SAM) is already running on port 3000, you will be asked to use another port. Type **Y** to run the frontend on `3001`.

## Connecting to the Backend
To work with real data locally, the frontend needs to know where the backend API lives.
- **The Address:** `http://127.0.0.1:3000` is the local "tunnel" created by AWS SAM.
- **Why the .env?** By using `REACT_APP_API_URL`, we can point to our local machines during development and easily swap to the live AWS Lambda URL for production without changing any code.

## How to Run a Full Test
To test a PR that affects data flow, you must have both layers running:
1. **Terminal 1 (Backend):** `sam local start-api` (keep this running)
2. **Terminal 2 (Frontend):** `npm start` 
3. **Verify:** Check the browser; if the UI says "Error fetching data," ensure Terminal 1 hasn't crashed.

## Production
To verify the app is ready for deployment:
1. Run `npm run build`.
2. If the build succeeds, the project is ready for AWS hosting. 
3. To preview the production build locally: `npx serve -s build`.

## PR Review Checklist
Before approving a Frontend PR, please verify:
- [ ] Console check: Open DevTools (F12) and ensure there are no red errors.
- [ ] Responsiveness: Does the UI look correct on different screen sizes?
- [ ] API Connection: Is the app successfully fetching/sending data to the local SAM API? (Check the Network tab).

## Available Scripts
`npm start` - Runs the app in development mode. The page will reload if you make edits. You will see any lint errors in the console.\
`npm test` - Launches the test runner in interactive watch mode. Run this before submitting a PR to ensure no components are broken.\
`npm run build` - Builds the app for production to the build folder. It correctly bundles React in production mode for the best performance.
