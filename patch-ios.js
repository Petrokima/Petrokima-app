// Adds what Apple requires to the generated iPhone project (run after `npx cap add ios`, before `npx cap sync ios`):
//   · Info.plist: the location message (English + Arabic), app name, export compliance (no own encryption)
//   · PrivacyInfo.xcprivacy (24 Nov 2026): Apple's "privacy manifest" — what the app collects and why, which sensitive
//     phone functions it uses (UserDefaults: the app's own settings) — required for every upload since 1 May 2024
//   · Push notifications (24 Nov 2026): App.entitlements (aps-environment production) + the two AppDelegate hooks the
//     Capacitor push plugin needs to receive the phone's Apple notification address (APNs device token)
//   · LocationGuard (28 Nov 2026): the same two calls as the Android app — inspect() = was the location made up by a
//     fake-GPS tool (Apple's "simulated by software" mark, iOS 15+), uptime() = a counter that keeps running while the phone
//     sleeps and cannot be changed by the user, for check-ins sent later without internet (file 92). Registered through a
//     small MainViewController (Capacitor's way for code inside the app itself). NO "left the office" watch on iPhone
//     (Mohammed, 28 Nov 2026) — the app never asks for "Always" location.
//   · Oldest iPhone system allowed: iOS 16 (older iPhones keep the web app)
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
must(!/NSLocationAlways|<string>location<\/string>/.test(p), 'the iPhone app must never ask for "Always" location or run location in the background');
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
\t\t<dict>
\t\t\t<key>NSPrivacyAccessedAPIType</key><string>NSPrivacyAccessedAPICategorySystemBootTime</string>
\t\t\t<key>NSPrivacyAccessedAPITypeReasons</key><array><string>35F9.1</string></array>
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
x = x.replace(/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/g, 'IPHONEOS_DEPLOYMENT_TARGET = 16.0;');
must(/IPHONEOS_DEPLOYMENT_TARGET = 16\.0;/.test(x) && !/IPHONEOS_DEPLOYMENT_TARGET = (?!16\.0;)/.test(x), 'could not set the oldest iPhone system to iOS 16');
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
// ── LocationGuard: fake-GPS check + the phone's own counter (same names and answers as the Android plugin) ──
a = fs.readFileSync(adPath, 'utf8');
if (!a.includes('LocationGuardPlugin')) {
  a = a.replace(/import Capacitor\n/, 'import Capacitor\nimport CoreLocation\n');
  a = a.trimEnd() + `

// Capacitor's way to add the app's own native code: this view controller replaces CAPBridgeViewController in Main.storyboard
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(LocationGuardPlugin())
    }
}

@objc(LocationGuardPlugin)
public class LocationGuardPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LocationGuardPlugin"
    public let jsName = "LocationGuard"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "inspect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "uptime", returnType: CAPPluginReturnPromise)
    ]
    private var manager: CLLocationManager?

    // The latest location the phone has (the one just used for the check-in): did a fake-GPS tool make it?
    // Only "simulated by software" counts, as on Android; a GPS accessory (for example a car) is not refused.
    @objc func inspect(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if self.manager == nil { self.manager = CLLocationManager() }
            var mock = false
            var seen = 0
            if let l = self.manager?.location, abs(l.timestamp.timeIntervalSinceNow) <= 180 {
                seen = 1
                if let s = l.sourceInformation, s.isSimulatedBySoftware { mock = true }
            }
            call.resolve(["mock": mock, "checked": seen])
        }
    }

    // A counter that keeps running while the phone sleeps and cannot be changed by the user (unlike the clock), and a number
    // for this start-up of the phone. The number is random and the counter is moved by a random amount, both chosen once per
    // start-up and kept in this app's own settings, so what is sent never tells when the phone was started — the server only
    // uses the difference between two taps of the same start-up.
    @objc func uptime(_ call: CAPPluginCall) {
        var tb = mach_timebase_info_data_t()
        mach_timebase_info(&tb)
        let ms = Int64(Double(mach_continuous_time()) * Double(tb.numer) / Double(tb.denom) / 1_000_000)
        guard let session = LocationGuardPlugin.bootSession() else {
            call.resolve(["ms": ms, "boot": -1])
            return
        }
        call.resolve(["ms": ms + session.shift, "boot": session.id])
    }

    static func bootSession() -> (id: Int, shift: Int64)? {
        var size = 0
        guard sysctlbyname("kern.bootsessionuuid", nil, &size, nil, 0) == 0, size > 1 else { return nil }
        var buf = [CChar](repeating: 0, count: size)
        guard sysctlbyname("kern.bootsessionuuid", &buf, &size, nil, 0) == 0 else { return nil }
        let uuid = String(cString: buf)
        let d = UserDefaults.standard
        if d.string(forKey: "pk_boot_uuid") != uuid || d.integer(forKey: "pk_boot_id") <= 0 {
            d.set(uuid, forKey: "pk_boot_uuid")
            d.set(Int(Int32.random(in: 1...Int32.max)), forKey: "pk_boot_id")
            d.set(NSNumber(value: Int64.random(in: 0...1_000_000_000_000)), forKey: "pk_boot_shift")
        }
        let shift = (d.object(forKey: "pk_boot_shift") as? NSNumber)?.int64Value ?? 0
        return (d.integer(forKey: "pk_boot_id"), shift)
    }
}
`;
  must(a.includes('class MainViewController: CAPBridgeViewController') && a.includes('import CoreLocation') && a.includes('jsName = "LocationGuard"'),
       'could not add LocationGuard to AppDelegate.swift');
  fs.writeFileSync(adPath, a);
}
const sbPath = path.join(appDir, 'Base.lproj', 'Main.storyboard');
let sb = fs.readFileSync(sbPath, 'utf8');
if (!sb.includes('customClass="MainViewController"')) {
  sb = sb.replace(/customClass="CAPBridgeViewController" customModule="Capacitor"/, 'customClass="MainViewController" customModule="App" customModuleProvider="target"');
  must(sb.includes('customClass="MainViewController" customModule="App" customModuleProvider="target"'), 'could not point Main.storyboard to MainViewController');
  fs.writeFileSync(sbPath, sb);
}
console.log('✔ iPhone project patched — location message, app name, export compliance, privacy manifest, push notifications, LocationGuard, iOS 16');
