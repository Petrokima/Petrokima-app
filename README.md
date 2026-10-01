# Petrokima — Android and iPhone app

The same app as the web version (petrokima.github.io/hr), packaged as a real Android / iPhone app.
It uses the phone's native location service, keeps the phone registration in native storage,
and talks to the same Supabase database — logins, approvals, offline check-ins all work the same.

## Android — build and publish (GitHub does the work)
1. This folder's contents go into a **Public** GitHub repository (e.g. `petrokima-hr/petrokima-app`).
2. Add 5 secrets: Settings → Secrets and variables → Actions → New repository secret
   (values are in the private file `KEEP-PRIVATE-android-signing-secrets.txt`, plus your Supabase key).
3. Actions → "Build Android app" → Run workflow (it also runs by itself after every upload).
4. After ~10 minutes: Releases → Petrokima.apk. Employee download link, always the newest version:
   `https://github.com/<owner>/<repo>/releases/latest/download/Petrokima.apk`

## Updating the app
Replace `web/index.html` (same file as the web version) and commit — a new Android build is published
automatically, and phones show "A new version of the app is available".

## iPhone
Prepared (`scripts/patch-ios.js`, `codemagic.yaml`). Activated once the Apple Developer account is approved.
