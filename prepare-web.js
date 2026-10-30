// Builds the "www" folder the app ships with, from the same code as the web app (web/ = mobile/index.html + mobile/app.js).
// - uses local copies of the Supabase, Capacitor and error-reporting libraries and of the fonts (works offline, no CDN)
// - fills in the Supabase key, the build number and the repository from the build settings (in app.js — since 30 Oct 2026
//   all the app's code is in app.js; the page itself holds no code)
// Files may sit in web/, at the repository root (Petrokima-app keeps a flat layout) or in ../mobile (the source repository).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'web'), out = path.join(root, 'www');
const find = (...rel) => [src, root, path.join(root, '..', 'mobile')].map(d => path.join(d, ...rel)).find(f => fs.existsSync(f));
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'vendor'), { recursive: true });
for (const f of fs.readdirSync(src)) if (!['sw.js'].includes(f) && fs.statSync(path.join(src, f)).isFile()) fs.copyFileSync(path.join(src, f), path.join(out, f));
fs.copyFileSync(path.join(root, 'node_modules', '@supabase', 'supabase-js', 'dist', 'umd', 'supabase.js'), path.join(out, 'vendor', 'supabase.js'));
fs.copyFileSync(path.join(root, 'node_modules', '@capacitor', 'core', 'dist', 'capacitor.js'), path.join(out, 'vendor', 'capacitor.js'));
// error reporting library (self-hosted copy, see mobile/vendor/sentry.js)
const sentrySrc = find('vendor', 'sentry.js');
if (sentrySrc) fs.copyFileSync(sentrySrc, path.join(out, 'vendor', 'sentry.js')); else console.warn('⚠ vendor/sentry.js not found — the app will run without error reporting');
// fonts (self-hosted Cairo)
const fontDir = find('fonts', 'cairo.css');
if (fontDir) fs.cpSync(path.dirname(fontDir), path.join(out, 'fonts'), { recursive: true }); else console.warn('⚠ fonts/ not found — system fonts will be used');
// the app's code
const appSrc = find('app.js');
if (!appSrc) throw new Error('app.js is missing (it must sit next to index.html)');

let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
const cdn = /<script src="(https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2|vendor\/supabase\.js)[^"]*"[^>]*><\/script>/;
if (!cdn.test(html)) throw new Error('Could not find the Supabase script tag in web/index.html');
html = html.replace(cdn, '<script src="vendor/capacitor.js"></script>\n<script src="vendor/supabase.js"></script>');
html = html.replace(/<script src="vendor\/sentry\.js\?v=[^"]*"><\/script>/, sentrySrc ? '<script src="vendor/sentry.js"></script>' : '');
html = html.replace(/<script src="app\.js\?v=[^"]*"><\/script>/, '<script src="app.js"></script>');
html = html.replace(/href="fonts\/cairo\.css\?v=[^"]*"/, 'href="fonts/cairo.css"');
// The web pages carry a strict security policy. Inside the app it is left out for now: Capacitor adds its own start-up code
// to the page, which such a policy may block — test builds (branches test/…) keep it, to try it on a phone first.
if (process.env.ANDROID_STRICT_CSP === '1') console.log('✔ TEST build: strict security policy kept in the app');
else html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\n?/, '');
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '');                       // web-app install files are not needed inside the app
if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) throw new Error('index.html must not contain code (inline <script>) — it belongs in app.js');
fs.writeFileSync(path.join(out, 'index.html'), html);

let code = fs.readFileSync(appSrc, 'utf8');
const key = process.env.SUPABASE_ANON_KEY || '';
if (key) code = code.replace("'PASTE-YOUR-ANON-KEY-HERE'", JSON.stringify(key));
else if (code.includes('PASTE-YOUR-ANON-KEY-HERE')) console.warn('⚠ SUPABASE_ANON_KEY is not set — the app will show "not configured". Add it as a GitHub secret.');
code = code.replace('const APP_BUILD = 0;', `const APP_BUILD = ${Number(process.env.APP_BUILD || 1)};`);
code = code.replace("const APK_REPO  = '';", `const APK_REPO  = ${JSON.stringify(process.env.APK_REPO || '')};`);
code = code.replace("const APK_DOWNLOAD = '';", `const APK_DOWNLOAD = ${JSON.stringify(process.env.APK_DOWNLOAD || '')};`);
fs.writeFileSync(path.join(out, 'app.js'), code);
console.log(`✔ www prepared — build ${process.env.APP_BUILD || 1}${key ? ', Supabase key filled in' : ''}`);
