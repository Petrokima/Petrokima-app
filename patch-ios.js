// Adds what Apple requires to the generated iPhone project: the location message and app details.
const fs = require('fs'), path = require('path');
const plistPath = path.join(__dirname, '..', 'ios', 'App', 'App', 'Info.plist');
let p = fs.readFileSync(plistPath, 'utf8');
const add = (key, xml) => { if (!p.includes(`<key>${key}</key>`)) p = p.replace(/<dict>/, `<dict>\n\t<key>${key}</key>\n\t${xml}`); };
add('NSLocationWhenInUseUsageDescription', '<string>Petrokima records your location when you check in or out at work. يسجّل تطبيق بتروكيما موقعك عند تسجيل الحضور والانصراف.</string>');
add('ITSAppUsesNonExemptEncryption', '<false/>');
p = p.replace(/<key>CFBundleDisplayName<\/key>\s*<string>[^<]*<\/string>/, '<key>CFBundleDisplayName</key>\n\t<string>Petrokima</string>');
if (!p.includes('NSLocationWhenInUseUsageDescription')) throw new Error('Could not add the location message to Info.plist');
fs.writeFileSync(plistPath, p);
console.log('✔ iPhone project patched — location message, app name, export compliance');
