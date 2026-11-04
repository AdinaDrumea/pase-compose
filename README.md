# Passé composé – Übungen

A small static practice app for French passé composé.

## Features

- Six practice modes
- More sentence examples with varied grammatical persons
- French special-character buttons, including the apostrophe
- Percentage score at the end of each test
- Latest result saved locally on the device with `localStorage`
- Error-only review for the one-by-one exercises

## GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository root:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `.nojekyll`
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. GitHub will show the public link once Pages is enabled.

No server, database, build step, or npm install is required. Saved results remain only in that browser/device and disappear if browser site data is cleared.

## Current exercise structure

The app now has eight exercise blocks. The sentence practice is split into four shorter sets of 12 questions (two gap-fill sets and two present-to-passé-composé sets), with locally saved last scores.
