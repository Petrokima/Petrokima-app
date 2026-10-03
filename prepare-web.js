// Builds the "www" folder the app ships with, from the same code as the web app (web/).
// - uses local copies of the Supabase and Capacitor libraries (works offline, no CDN needed)
// - fills in the Supabase key, the build number and the repository from the build settings
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'web'), out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'vendor'), { recursive: true });
for (const f of fs.readdirSync(src)) if (!['sw.js'].includes(f)) fs.copyFileSync(path.join(src, f), path.join(out, f));
fs.copyFileSync(path.join(root, 'node_modules', '@supabase', 'supabase-js', 'dist', 'umd', 'supabase.js'), path.join(out, 'vendor', 'supabase.js'));
fs.copyFileSync(path.join(root, 'node_modules', '@capacitor', 'core', 'dist', 'capacitor.js'), path.join(out, 'vendor', 'capacitor.js'));

let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
const cdn = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"><\/script>/;
if (!cdn.test(html)) throw new Error('Could not find the Supabase script tag in web/index.html');
html = html.replace(cdn, '<script src="vendor/capacitor.js"></script>\n<script src="vendor/supabase.js"></script>');
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '');                       // web-app install files are not needed inside the app
const key = process.env.SUPABASE_ANON_KEY || '';
if (key) html = html.replace("'PASTE-YOUR-ANON-KEY-HERE'", JSON.stringify(key));
else if (html.includes('PASTE-YOUR-ANON-KEY-HERE')) console.warn('⚠ SUPABASE_ANON_KEY is not set — the app will show "not configured". Add it as a GitHub secret.');
html = html.replace('const APP_BUILD = 0;', `const APP_BUILD = ${Number(process.env.APP_BUILD || 1)};`);
html = html.replace("const APK_REPO  = '';", `const APK_REPO  = ${JSON.stringify(process.env.APK_REPO || '')};`);
html = html.replace("const APK_DOWNLOAD = '';", `const APK_DOWNLOAD = ${JSON.stringify(process.env.APK_DOWNLOAD || '')};`);
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log(`✔ www prepared — build ${process.env.APP_BUILD || 1}${key ? ', Supabase key filled in' : ''}`);
