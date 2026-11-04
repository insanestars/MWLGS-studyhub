# Study Hub

A study site for the **Maggie L. Walker Governor's School (MLWGS) admissions test**: timed reasoning sections, **no-calculator math**, reading comprehension, vocabulary, and timed essays on surprise topics. You write essays on paper, then scan them for transcription and tutor feedback.

**Live site:** https://insanestars.github.io/MWLGS-studyhub/

Plain HTML, CSS and JavaScript with no build step. It works on phones and laptops, has a dark mode, can be installed as an app, and works offline after the first visit (everything except the AI tutor).

## What's inside

| Section | Features |
|---|---|
| **Home** | Exam countdown · daily question goal · quick starts · weakest topics with one-tap practice · word of the day · this week's activity |
| **Practice** | 21 question types in 5 sections, generated fresh every time (no fixed lists to run out of), at Warm-up / Exam / Challenge level. **Verbal:** analogies (25 relationship types, 438 word pairs), sentence completion (110), vocabulary in context (built from 644 example sentences), classification (68 categories), odd one out. **Reading:** 24 original passages (civics, world history, science, biography, economics, fiction, poetry, opinion) with 120 questions on main idea, details, inference, vocab in context, tone and purpose; the passage stays on screen beside its questions. **Math (no calculator), every answer with step-by-step working:** arithmetic, fractions/decimals/percents, ratios & proportions, word problems, Algebra I (equations, inequalities, slope, systems, exponents, factoring, functions), geometry. **Quantitative:** number analogies, number puzzles, number series, letter series. **Nonverbal (SVG):** figure matrices, paper folding, figure classification, figure balancing, shape sequences |
| **Timed modes** | ⏱ Timed drill for every section (5–30 questions, relaxed/exam/fast pace) · 🏁 **Full mock test** (5 timed sections → timed surprise essay) · 📝 CogAT-style test (9 subtests, real length 176 questions / 90 min, or half / quarter) · ⚡ Speed sprint (3/5/10 min) · custom timed drill |
| **Mistakes** | Every missed question is saved; redo by topic, by section, or all; a question leaves the list once you get it right · 🚩 flag questions · 💡 “How to solve” strategy for every type |
| **Essay** | 192 prompts: personal narrative, describe a challenge, opinion/argument, current events, surprise · timer of 15–60 min with alerts that scale to the length · two essays back to back · full-screen timer · planning guide · type-along word counter with pace · self-check checklist · essay log · **scanner** (photo/PDF, clean-up filters, PDF export) · **AI tutor** transcription + rubric feedback + chat (Gemini or Claude) or the free instant quick check · writing toolkit |
| **Vocab** | 644 words in 14 categories (incl. “cool words”) with definitions and example sentences · 134 Greek/Latin roots, prefixes and suffixes · spaced-repetition flashcards (missed words come back a few cards later and again the same day) · quizzes weighted toward your weak words (meaning, word, fill-in-the-blank, roots) · 60-second blitz · weak-words filter · searchable list |
| **Progress** | Saved in the browser (and synced if you sign in) · streak · score and speed over time · accuracy by section and by topic · weakest topics · reading-skill accuracy · essays, checklist and tutor averages · vocabulary mastered · backup export/import |

Keyboard: **Space** pauses the essay timer, **F** toggles full screen; in practice, **1–5** (or A–E) answers, **Enter** moves on, **F** flags.

## AI tutor (optional)

The tutor reads handwriting (photos or PDF), scores essays against a rubric, suggests line edits and vocabulary, rewrites one passage, and answers follow-up questions. Choose either provider in **👤 → AI tutor**:

- **Gemini** (free tier available): create a key at <https://aistudio.google.com/apikey>. The site tries `gemini-flash-latest`, then `gemini-3.5-flash`, `gemini-3.8-flash` and `gemini-flash-lite-latest` if a model is busy or unavailable.
- **Claude**: create a key at <https://console.anthropic.com/settings/keys> (about 5–15¢ per essay). Uses `claude-opus-5-5` through the official Anthropic SDK, with server-side fallback enabled.

Keys are stored **only in that browser** — never in the code, the repo or Firestore. Add a key on each device you use. **Never paste a key into the code or commit it:** this repository is public. For extra safety, restrict a Gemini key to the website `insanestars.github.io` (Google Cloud console → APIs & Services → Credentials → the key → *Website restrictions*). Without a key, everything else still works.

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
node tests/puzzles.test.js       # thousands of questions: all 21 types × 3 levels, plus every content bank
node tests/writing.test.js       # quick-check essay analysis
node tests/ui.test.js            # full browser test, laptop + phone + offline (needs Playwright)
```

The AI-tutor test runs the real Anthropic SDK and the Gemini REST calls against fake APIs (no keys needed):

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
js/puzzles.js            registry of question types, sections, CogAT test, full mock test
js/gemini.js             Gemini provider for the AI tutor
js/gen/*.js              generators: verbal, quant, math (mathkit/math-a/math-b), reading, figures, folding, balance, draw.js
js/data/*.js             vocabulary (vocab-a..d), roots, reading passages, word relationships, sentence bank
sw.js, manifest.webmanifest, icons/   offline support / installable app
js/render.js             draws questions and options
js/learn.js              "How to solve" strategies
js/reasoning.js          practice, timed drills, full mock, CogAT test, sprint, mistakes, flagged
js/vocab.js              flashcards, quizzes, blitz, roots, word list
js/progress.js           streak, charts, activity grid
firestore.rules          database security rules
```

Data layout in Firestore (each user can only reach their own `users/{uid}`): `essays/*` (with transcript and tutor feedback), `rounds/*`, `mistakes/*`, `flags/*`, and `meta/main` (streak days, daily counts, vocabulary progress, settings).
