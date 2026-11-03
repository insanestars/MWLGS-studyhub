# Study Hub

A study site for a high-school entrance exam: a **40-minute handwritten essay** (personal narrative or argumentative) and a **reasoning test**. You write the essay on paper. The site gives you prompts, a timer and a self-check, and it tracks your progress.

**Live site:** https://insanestars.github.io/MWLGS-studyhub/ (once GitHub Pages is switched on, see [Deploying](#deploying-github-pages))

Plain HTML, CSS and JavaScript with no build step. It works on phones and laptops and has a dark mode.

## What's inside

| Section | Features |
|---|---|
| **Essay** | 45 narrative + 45 argumentative prompts · Narrative / Argumentative / Surprise me (one of each) · pick 1 of 2 prompts · big 40-min countdown with full-screen mode · alerts at 35, 10 and 5 min left (sound on/off, vibration on phones) · keeps the screen awake · survives a page refresh · self-check checklist · log with score, quick tags and notes · scrollable, filterable history |
| **Reasoning** | Unlimited generated puzzles: number series, letter series, word analogies, odd one out, SVG shape patterns · 10-question timed round (5 min) or untimed practice (pick the types) · answer + one-line explanation after each question · "Review my mistakes" retries only the ones you got wrong (a puzzle leaves the list once you get it right) |
| **Progress** | Daily streak (current + best) · 12-week activity grid · reasoning score and speed charts · essays by type with average checklist score · accuracy by puzzle type |

Keyboard shortcuts: **Space** pauses/resumes the essay timer and **F** toggles full screen. In reasoning, **1–4** (or A–D) answers and **Enter** moves to the next question.

## Firebase setup (Google sign-in + cloud sync)

Until you do this, the site works in **"this device only"** mode and saves progress in the browser. Firebase setup is free (Spark plan) and takes about 10 minutes.

### 1. Create the project
1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Create a project** (or **Add project**).
3. Name it, e.g. `studyhub`, and click **Continue**.
4. Turn **Google Analytics off** (you don't need it), then click **Create project** and wait. Click **Continue**.

### 2. Register the web app (this gives you the config to copy)
1. On the project overview page, click the **web icon `</>`** ("Add app" → Web).
2. App nickname: `studyhub-web`. **Don't** tick "Firebase Hosting". Click **Register app**.
3. You'll see a code block containing `const firebaseConfig = { apiKey: "...", authDomain: "...", ... }`.
   **Copy everything between the `{` and `}`.** That is what you send back to me, or paste into `js/firebase-config.js` yourself.
4. Click **Continue to console**.

> These values are not passwords. They only identify your project. Your data is protected by the security rules in step 5.

### 3. Turn on Google sign-in
1. In the left menu: **Build → Authentication → Get started**.
2. On the **Sign-in method** tab, click **Google**, switch **Enable** on, choose your email as the "Project support email", then click **Save**.

### 4. Authorize your GitHub Pages domain
1. Still in **Authentication**, open the **Settings** tab → **Authorized domains**.
2. Click **Add domain** and enter: `insanestars.github.io`
3. (`localhost` is already there for local testing.)

### 5. Create the database and lock it down
1. Left menu: **Build → Firestore Database → Create database**.
2. Pick a location close to you (e.g. `eur3 (europe-west)` or `nam5 (us-central)`). **You can't change this later.**
3. Choose **Start in production mode** and click **Create**.
4. Open the **Rules** tab, delete everything there, paste in the contents of [`firestore.rules`](firestore.rules) from this repo, and click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This means a signed-in user can only read and write documents under `users/<their own id>`. Everything else is denied.

### 6. Paste the config
Open `js/firebase-config.js` and replace the `PASTE_...` values with your own, then commit and push. The site will now show **Sign in with Google**. If you saved progress on a device before signing in, the site offers to copy it into your account.

## Deploying (GitHub Pages)

The workflow in `.github/workflows/pages.yml` runs the puzzle tests and publishes the site whenever `main` changes.

1. Merge this branch into `main`.
2. On GitHub, open the repo → **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open the **Actions** tab. If the "Deploy to GitHub Pages" run hasn't started, click it and then **Run workflow**.
4. After about a minute the site is live at **https://insanestars.github.io/MWLGS-studyhub/**

## Running and testing locally

```bash
python3 -m http.server 8000      # then open http://localhost:8000
node tests/puzzles.test.js       # 15,000 generated puzzles checked for validity
node tests/ui.test.js            # full browser test, laptop + phone (needs Playwright)
```

Firebase tests run against the local emulators (needs Java):

```bash
npm i -D firebase-tools@13 firebase@10.12.2 @firebase/rules-unit-testing@3
```

```bash
npx firebase emulators:start --project demo-studyhub
```

```bash
node tests/rules.test.js firestore.rules
```

```bash
FIREBASE_SDK_DIR=node_modules/firebase node tests/cloud.test.js
```

## Files

```
index.html               page structure
css/style.css            design + light/dark themes
js/app.js                start-up, sign-in, navigation, theme
js/store.js              saving data (Firestore or browser storage)
js/firebase-config.js    ← your Firebase config goes here
js/prompts.js            essay prompt banks + checklists (add your own prompts here)
js/essay.js              prompt picker, 40-min timer, self-check, log
js/puzzles.js            reasoning puzzle generators
js/shapes.js             SVG drawing for shape puzzles
js/reasoning.js          timed / practice / review modes
js/progress.js           streak, charts, activity grid
firestore.rules          database security rules
```

Data layout in Firestore: `users/{uid}/essays/*`, `users/{uid}/rounds/*`, `users/{uid}/meta/main` (mistakes to review, active days for the streak, settings).
