# Study Hub

A study site for a high-school entrance exam: a **CogAT-style reasoning test** and a **40-minute handwritten essay** (personal narrative or argumentative). You write the essay on paper, then scan it for transcription and tutor feedback.

**Live site:** https://insanestars.github.io/MWLGS-studyhub/

Plain HTML, CSS and JavaScript with no build step. It works on phones and laptops and has a dark mode.

## What's inside

| Section | Features |
|---|---|
| **Home** | Exam-day countdown · daily question goal ring · quick starts · your 3 weakest question types with one-tap practice · word of the day · this week's activity · exam tips |
| **Reasoning (CogAT-style)** | 14 question types, generated fresh every time at 3 levels (Warm-up, **Grade 9–10**, Challenge), all with 5 options (A–E) like the real test. **Verbal:** analogies (16 relationship types, ~300 word pairs with tricky lures), sentence completion (70 items, incl. two-blank), verbal classification, odd one out. **Quantitative:** number analogies (each checked so only one rule fits), number puzzles (equations, symbol chains, two-symbol systems), number series (15 rule families), letter series, grade 9–10 math (algebra, systems, percents, exponents, Pythagoras, circles, probability, slope, functions, statistics, inequalities…). **Nonverbal (SVG):** figure matrices (2×2 transformations, 3×3 Latin squares, rotations and line overlays), paper folding (real fold simulation, 1–3 folds), figure classification, figure balancing on scales, shape sequences. **Modes:** timed mix · **mock CogAT** (9 timed subtests, skip/back within a section, no feedback until the end, battery breakdown) · untimed practice · review mistakes · flagged questions · "How to solve" strategies for every type, plus a 💡 hint button |
| **Essay** | 52 narrative + 65 formal, debate-style argumentative prompts (grade 9–10) · Narrative / Argumentative / Surprise me · pick 1 of 2 · big 40-min countdown, full-screen mode, alerts at 35/10/5 min with sound toggle · planning guide during the timer · self-check checklist · essay log · **scanner:** take photos or upload images/PDF, scan/B&W clean-up, rotate and reorder pages, **download as PDF** · **transcription:** AI tutor (reads handwriting) or free on-device text reader · **feedback:** AI tutor (rubric scores, strengths, improvements, line edits, vocabulary upgrades, a rewritten passage, follow-up chat) or the free instant quick check · writing toolkit |
| **Vocab** | 143 grade 9–10 words · spaced-repetition flashcards · quizzes both ways · searchable list with mastery |
| **Progress** | Daily streak · 12-week activity grid · reasoning score and speed charts · CogAT battery accuracy · accuracy by question type · essays by type · average checklist and tutor scores · words mastered · export/import backup |

Keyboard shortcuts: **Space** pauses/resumes the essay timer and **F** toggles full screen. In reasoning, **1–5** (or A–E) answers, **Enter** moves on and **F** flags a question.

## AI tutor (optional)

The tutor uses Claude (`claude-opus-5-5`) through the official Anthropic SDK, straight from your browser:

1. Create an API key at <https://console.anthropic.com/settings/keys> (needs a payment method; an essay costs roughly 5–15¢ for transcription + feedback).
2. On the site, open **👤 → AI tutor**, paste the key and click **Save key**.

The key is stored **only in that browser** (not in the code, the repo or Firestore). Add it on each device you use. Server-side fallback is enabled, so if a request is declined the API retries it on a fallback model automatically. Without a key, everything else still works: the free text reader and the instant quick check run on your device.

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
node tests/puzzles.test.js       # thousands of puzzles: every type × 3 levels checked for validity
node tests/writing.test.js       # quick-check essay analysis
node tests/ui.test.js            # full browser test, laptop + phone (needs Playwright)
```

The AI-tutor test runs the real Anthropic SDK against a fake API (no key needed):

```bash
SDK_BUNDLE=path/to/sdk.mjs JSPDF=node_modules/jspdf/dist/jspdf.umd.min.js node tests/tutor.test.js
```

(`sdk.mjs` = `@anthropic-ai/sdk@0.137.0` bundled with esbuild from `export { default } from "@anthropic-ai/sdk";`)

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
js/app.js                start-up, sign-in, navigation, theme, settings
js/store.js              saving data (Firestore or browser storage)
js/firebase-config.js    ← your Firebase config goes here
js/home.js               dashboard
js/prompts.js            essay prompt banks, checklists, planning guides (add your own prompts here)
js/essay.js              prompt picker, 40-min timer, self-check, log
js/scan.js               scanner, PDF export, transcription, feedback screen
js/tutor.js              AI tutor (Claude via the Anthropic SDK)
js/writing.js            free instant essay quick check
js/puzzles.js            registry of question types, CogAT batteries, mock tests
js/gen/*.js              generators: verbal, quant, math, figures, folding, balance (+ draw.js SVG kit)
js/data/*.js             word relationships, categories, vocabulary, sentence bank
js/render.js             draws questions and options
js/learn.js              "How to solve" strategies
js/reasoning.js          timed / mock / practice / review / flagged modes
js/vocab.js              flashcards, quiz, word list
js/progress.js           streak, charts, activity grid
firestore.rules          database security rules
```

Data layout in Firestore (each user can only reach their own `users/{uid}`): `essays/*` (with transcript and tutor feedback), `rounds/*`, `mistakes/*`, `flags/*`, and `meta/main` (streak days, daily counts, vocabulary progress, settings).
