// Adds what Petrokima needs to the generated Android project:
// location permission, the version number of this build, and release signing from GitHub secrets.
const fs = require('fs'), path = require('path');
const app = path.join(__dirname, '..', 'android', 'app');
const manifestPath = path.join(app, 'src', 'main', 'AndroidManifest.xml');
let m = fs.readFileSync(manifestPath, 'utf8');
if (!m.includes('ACCESS_FINE_LOCATION')) {
  m = m.replace('<uses-permission android:name="android.permission.INTERNET" />',
`<uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />`);
  if (!m.includes('ACCESS_FINE_LOCATION')) throw new Error('Could not add location permission to AndroidManifest.xml');
}
fs.writeFileSync(manifestPath, m);

const gradlePath = path.join(app, 'build.gradle');
let g = fs.readFileSync(gradlePath, 'utf8');
const build = Number(process.env.BUILD_NUMBER || 1);
g = g.replace(/versionCode \d+/, `versionCode ${build}`).replace(/versionName "[^"]*"/, `versionName "1.0.${build}"`);
if (!g.includes('signingConfigs')) {
  g = g.replace('    buildTypes {', `    signingConfigs {
        release {
            if (System.getenv("KEYSTORE_PATH")) {
                storeFile file(System.getenv("KEYSTORE_PATH"))
                storePassword System.getenv("KEYSTORE_PASSWORD")
                keyAlias System.getenv("KEY_ALIAS")
                keyPassword System.getenv("KEY_PASSWORD")
            }
        }
    }
    buildTypes {`);
  g = g.replace("            minifyEnabled false\n", "            minifyEnabled false\n            signingConfig signingConfigs.release\n");
  if (!g.includes('signingConfig signingConfigs.release')) throw new Error('Could not add release signing to build.gradle');
}
fs.writeFileSync(gradlePath, g);
console.log(`✔ Android project patched — location permission, version 1.0.${build}, release signing`);
