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

// ── LocationGuard: tells the app whether the location came from a fake-location ("mock") app ──
const javaDir = path.join(app, 'src', 'main', 'java', 'com', 'petrokima', 'hr');
fs.mkdirSync(javaDir, { recursive: true });
fs.writeFileSync(path.join(javaDir, 'LocationGuardPlugin.java'), `package com.petrokima.hr;

import android.content.Context;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.SystemClock;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LocationGuard")
public class LocationGuardPlugin extends Plugin {

    private static boolean isMock(Location l) {
        if (l == null) return false;
        if (Build.VERSION.SDK_INT >= 31) return l.isMock();
        return l.isFromMockProvider();
    }

    // Looks at the most recent location the phone has (the one just used for the check-in) from every provider.
    @PluginMethod
    public void inspect(PluginCall call) {
        JSObject r = new JSObject();
        boolean mock = false; int seen = 0;
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            long now = SystemClock.elapsedRealtimeNanos();
            for (String p : lm.getProviders(true)) {
                Location l = null;
                try { l = lm.getLastKnownLocation(p); } catch (SecurityException e) { /* no permission */ }
                if (l == null) continue;
                long ageMs = (now - l.getElapsedRealtimeNanos()) / 1000000L;
                if (ageMs > 180000L) continue;          // only fixes from the last 3 minutes
                seen++;
                if (isMock(l)) mock = true;
            }
        } catch (Exception e) {
            r.put("error", String.valueOf(e.getMessage()));
        }
        r.put("mock", mock);
        r.put("checked", seen);
        call.resolve(r);
    }
}
`);
const mainJava = path.join(javaDir, 'MainActivity.java');
if (fs.existsSync(mainJava)) {
  let a = fs.readFileSync(mainJava, 'utf8');
  if (!a.includes('LocationGuardPlugin')) {
    a = a.replace(/public class MainActivity extends BridgeActivity\s*\{\s*\}/, `public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(LocationGuardPlugin.class);
        super.onCreate(savedInstanceState);
    }
}`);
    if (!a.includes('LocationGuardPlugin')) throw new Error('Could not register LocationGuard in MainActivity.java');
    fs.writeFileSync(mainJava, a);
  }
} else {
  throw new Error('MainActivity.java not found in ' + javaDir);
}

console.log(`✔ Android project patched — location permission, version 1.0.${build}, release signing, fake-GPS check`);

// ── Phone notifications (21 Oct 2026): Android 13+ permission, a white notification icon, default channel and colour ──
{
  let mf = fs.readFileSync(manifestPath, 'utf8');
  if (!mf.includes('POST_NOTIFICATIONS')) {
    mf = mf.replace('<uses-permission android:name="android.permission.INTERNET" />',
      '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />');
  }
  if (!mf.includes('default_notification_icon')) {
    mf = mf.replace(/(<application[^>]*>)/, `$1
        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_petrokima" />
        <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/petrokima_notification" />
        <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="petrokima" />`);
  }
  if (!mf.includes('POST_NOTIFICATIONS') || !mf.includes('default_notification_icon')) throw new Error('Could not add notification settings to AndroidManifest.xml');
  fs.writeFileSync(manifestPath, mf);
  const res = path.join(app, 'src', 'main', 'res');
  fs.mkdirSync(path.join(res, 'drawable'), { recursive: true });
  fs.mkdirSync(path.join(res, 'values'), { recursive: true });
  // a simple white bell (Android shows notification icons as white shapes)
  fs.writeFileSync(path.join(res, 'drawable', 'ic_stat_petrokima.xml'), `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF" android:pathData="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.63,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.64,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"/>
</vector>
`);
  fs.writeFileSync(path.join(res, 'values', 'petrokima_notification.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="petrokima_notification">#1F4FB5</color>
</resources>
`);
}
