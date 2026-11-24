// Adds what Apple requires to the generated iPhone project (run after `npx cap add ios`, before `npx cap sync ios`):
//   · Info.plist: the location message (English + Arabic), app name, export compliance (no own encryption)
//   · PrivacyInfo.xcprivacy (24 Nov 2026): Apple's "privacy manifest" — what the app collects and why, which sensitive
//     phone functions it uses (UserDefaults: the app's own settings) — required for every upload since 1 May 2024
//   · Push notifications (24 Nov 2026): App.entitlements (aps-environment production) + the two AppDelegate hooks the
//     Capacitor push plugin needs to receive the phone's Apple notification address (APNs device token)
// Every step checks its own result and stops the build with a clear message when the generated project looks different.
const fs = require('fs'), path = require('path');
const appDir = path.join(__dirname, '..', 'ios', 'App', 'App');
const pbxPath = path.join(__dirname, '..', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
const must = (ok, msg) => { if (!ok) throw new Error('patch-ios: ' + msg); };

// ── Info.plist ──
const plistPath = path.join(appDir, 'Info.plist');
let p = fs.readFileSync(plistPath, 'utf8');
const add = (key, xml) => { if (!p.includes(`<key>${key}</key>`)) p = p.replace(/<dict>/, `<dict>\n\t<key>${key}</key>\n\t${xml}`); };
add('NSLocationWhenInUseUsageDescription', '<string>Petrokima records your location when you check in or out at work. يسجّل تطبيق بتروكيما موقعك عند تسجيل الحضور والانصراف.</string>');
add('ITSAppUsesNonExemptEncryption', '<false/>');
p = p.replace(/<key>CFBundleDisplayName<\/key>\s*<string>[^<]*<\/string>/, '<key>CFBundleDisplayName</key>\n\t<string>Petrokima</string>');
must(p.includes('NSLocationWhenInUseUsageDescription'), 'could not add the location message to Info.plist');
fs.writeFileSync(plistPath, p);

// ── privacy manifest ──
const collected = (type, purposes) => `\t\t<dict>
\t\t\t<key>NSPrivacyCollectedDataType</key><string>NSPrivacyCollectedDataType${type}</string>
\t\t\t<key>NSPrivacyCollectedDataTypeLinked</key><true/>
\t\t\t<key>NSPrivacyCollectedDataTypeTracking</key><false/>
\t\t\t<key>NSPrivacyCollectedDataTypePurposes</key><array>${purposes.map((x) => `<string>NSPrivacyCollectedDataTypePurpose${x}</string>`).join('')}</array>
\t\t</dict>`;
const APP = ['AppFunctionality'];
const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>NSPrivacyTracking</key><false/>
\t<key>NSPrivacyTrackingDomains</key><array/>
\t<key>NSPrivacyCollectedDataTypes</key>
\t<array>
${[['Name', APP], ['EmailAddress', APP], ['PhoneNumber', APP], ['PhysicalAddress', APP], ['PreciseLocation', APP],
   ['UserID', APP], ['DeviceID', APP], ['OtherFinancialInfo', APP], ['PhotosorVideos', APP], ['OtherUserContent', APP],
   ['CrashData', APP], ['OtherDiagnosticData', APP]].map(([t, u]) => collected(t, u)).join('\n')}
\t</array>
\t<key>NSPrivacyAccessedAPITypes</key>
\t<array>
\t\t<dict>
\t\t\t<key>NSPrivacyAccessedAPIType</key><string>NSPrivacyAccessedAPICategoryUserDefaults</string>
\t\t\t<key>NSPrivacyAccessedAPITypeReasons</key><array><string>CA92.1</string></array>
\t\t</dict>
\t</array>
</dict>
</plist>
`;
fs.writeFileSync(path.join(appDir, 'PrivacyInfo.xcprivacy'), manifest);

// ── push: entitlements file ──
fs.writeFileSync(path.join(appDir, 'App.entitlements'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>aps-environment</key>
\t<string>production</string>
</dict>
</plist>
`);

// ── the Xcode project: the privacy file as a bundle resource, the entitlements for both build kinds ──
let x = fs.readFileSync(pbxPath, 'utf8');
const REF = 'B7A0C0DE0000000000000001', BUILD = 'B7A0C0DE0000000000000002';
if (!x.includes('PrivacyInfo.xcprivacy')) {
  const n0 = x.length;
  x = x.replace(/(\/\* Begin PBXBuildFile section \*\/\n)/,
    `$1\t\t${BUILD} /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = ${REF} /* PrivacyInfo.xcprivacy */; };\n`);
  x = x.replace(/(\/\* Begin PBXFileReference section \*\/\n)/,
    `$1\t\t${REF} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };\n`);
  x = x.replace(/(\n(\t+)[0-9A-F]{24} \/\* Info\.plist \*\/,\n)/, `$1$2${REF} /* PrivacyInfo.xcprivacy */,\n`);
  x = x.replace(/(isa = PBXResourcesBuildPhase;[\s\S]*?files = \(\n)/, `$1\t\t\t\t${BUILD} /* PrivacyInfo.xcprivacy in Resources */,\n`);
  const placed = [`${BUILD} /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile;`, `${REF} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference;`,
    `${REF} /* PrivacyInfo.xcprivacy */,\n`, `${BUILD} /* PrivacyInfo.xcprivacy in Resources */,\n`];
  must(x.length > n0 && placed.every((t) => x.split(t).length === 2), 'could not add PrivacyInfo.xcprivacy to the Xcode project');
}
if (!x.includes('CODE_SIGN_ENTITLEMENTS')) {
  x = x.replace(/(\n(\t+)INFOPLIST_FILE = App\/Info\.plist;)/g, '\n$2CODE_SIGN_ENTITLEMENTS = App/App.entitlements;$1');
  must((x.match(/CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements;/g) || []).length === 2, 'could not add the push entitlements to both build settings');
}
fs.writeFileSync(pbxPath, x);

// ── push: AppDelegate hands the Apple notification address to the Capacitor push plugin ──
const adPath = path.join(appDir, 'AppDelegate.swift');
let a = fs.readFileSync(adPath, 'utf8');
if (!a.includes('capacitorDidRegisterForRemoteNotifications')) {
  a = a.replace(/\n\}\s*$/, `

    // push notifications (Capacitor push plugin): pass the phone's Apple notification address, or the failure, to the app
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }
}
`);
  must(a.includes('capacitorDidRegisterForRemoteNotifications') && a.includes('capacitorDidFailToRegisterForRemoteNotifications'), 'could not add the push hooks to AppDelegate.swift');
  fs.writeFileSync(adPath, a);
}
console.log('✔ iPhone project patched — location message, app name, export compliance, privacy manifest, push notifications');
