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

    // 92: "time since the phone was switched on" (cannot be changed by the user, unlike the clock) and how many times the
    // phone has started. The server uses them to find the real time of a check-in made without internet.
    @PluginMethod
    public void uptime(PluginCall call) {
        JSObject r = new JSObject();
        r.put("ms", SystemClock.elapsedRealtime());
        int boots = -1;
        if (Build.VERSION.SDK_INT >= 24) {
            try { boots = android.provider.Settings.Global.getInt(getContext().getContentResolver(), android.provider.Settings.Global.BOOT_COUNT, -1); }
            catch (Exception e) { boots = -1; }
        }
        r.put("boot", boots);
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
        registerPlugin(LeaveWatchPlugin.class);
        super.onCreate(savedInstanceState);
        // Back button / back gesture: the app goes back one step (closes the open window, previous tab, Home).
        // Only when there is nothing left to go back to does the app move to the background (it is not closed).
        getOnBackPressedDispatcher().addCallback(this, new androidx.activity.OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                android.webkit.WebView w = getBridge() != null ? getBridge().getWebView() : null;
                if (w == null) { moveTaskToBack(true); return; }
                w.evaluateJavascript("(function(){try{return !!(window.pkBack && window.pkBack());}catch(e){return false;}})()",
                    v -> { if (!"true".equals(v)) moveTaskToBack(true); });
            }
        });
    }
}`);
    if (!a.includes('LocationGuardPlugin') || !a.includes('LeaveWatchPlugin')) throw new Error('Could not register LocationGuard / LeaveWatch in MainActivity.java');
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

// ── LeaveWatch (24 Oct 2026, 80-checkout-requests.sql): while the employee is checked in, from 10 minutes after the check-in,
//    the phone checks every ~15 minutes (WorkManager) whether he is still at his office. Found away twice in a row → it tells
//    the database (report_left_by_token, with a single-purpose token — no sign-in needed) and shows a notification.
//    Needs location "Allow all the time"; without it nothing happens. Stops at check-out, or 16 hours after the check-in.
{
  let mf = fs.readFileSync(manifestPath, 'utf8');
  if (!mf.includes('ACCESS_BACKGROUND_LOCATION')) {
    mf = mf.replace('<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
      '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />');
    if (!mf.includes('ACCESS_BACKGROUND_LOCATION')) throw new Error('Could not add background location permission to AndroidManifest.xml');
    fs.writeFileSync(manifestPath, mf);
  }
  mf = fs.readFileSync(manifestPath, 'utf8');
  if (!/android:allowBackup="false"/.test(mf)) {                 // review fix: no Google backup of the session, phone ID or watch token
    mf = mf.replace(/android:allowBackup="true"/, 'android:allowBackup="false"');
    if (!/android:allowBackup="false"/.test(mf)) mf = mf.replace(/<application(\s)/, '<application android:allowBackup="false"$1');
    if (!/android:allowBackup="false"/.test(mf)) throw new Error('Could not turn off Android backup in AndroidManifest.xml');
    fs.writeFileSync(manifestPath, mf);
  }
  let gr = fs.readFileSync(gradlePath, 'utf8');
  if (!gr.includes('androidx.work:work-runtime')) {
    gr = gr.replace(/\ndependencies \{/, '\ndependencies {\n    implementation "androidx.work:work-runtime:2.10.1"');
    if (!gr.includes('androidx.work:work-runtime')) throw new Error('Could not add WorkManager to build.gradle');
    fs.writeFileSync(gradlePath, gr);
  }
  fs.writeFileSync(path.join(javaDir, 'LeaveWatchPlugin.java'), `package com.petrokima.hr;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "LeaveWatch")
public class LeaveWatchPlugin extends Plugin {
    static final String PREFS = "petrokima_leave_watch";
    static final String WORK = "petrokima-leave-watch";

    static boolean hasBackground(Context c) {
        String p = Build.VERSION.SDK_INT >= 29 ? Manifest.permission.ACCESS_BACKGROUND_LOCATION : Manifest.permission.ACCESS_FINE_LOCATION;
        return ContextCompat.checkSelfPermission(c, p) == PackageManager.PERMISSION_GRANTED;
    }

    static void clear(Context c) {
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply();
        try { WorkManager.getInstance(c).cancelUniqueWork(WORK); } catch (Exception e) { /* nothing to cancel */ }
    }

    @PluginMethod
    public void start(PluginCall call) {
        Context c = getContext();
        String token = call.getString("token", "");
        if (token == null || token.isEmpty()) { call.reject("no token"); return; }
        SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean samePeriod = token.equals(sp.getString("token", ""));
        SharedPreferences.Editor e = sp.edit();
        if (!samePeriod) { e.remove("reported"); e.remove("pendingAt"); e.remove("awayCount"); }
        e.putString("token", token);
        e.putString("url", call.getString("url", ""));
        e.putString("key", call.getString("key", ""));
        e.putString("offices", call.getString("offices", "[]"));
        e.putString("title", call.getString("title", "You left without checking out"));
        e.putString("body", call.getString("body", ""));
        e.putLong("fromMs", call.getLong("fromMs", 0L));
        e.putLong("untilMs", call.getLong("untilMs", 0L));
        e.apply();
        PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(LeaveWatchWorker.class, 15, TimeUnit.MINUTES).build();
        WorkManager.getInstance(c).enqueueUniquePeriodicWork(WORK, ExistingPeriodicWorkPolicy.UPDATE, req);
        JSObject r = new JSObject();
        r.put("background", hasBackground(c));
        call.resolve(r);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        clear(getContext());
        call.resolve();
    }

    @PluginMethod
    public void status(PluginCall call) {
        Context c = getContext();
        JSObject r = new JSObject();
        r.put("background", hasBackground(c));
        r.put("notifications", Build.VERSION.SDK_INT < 33
            || ContextCompat.checkSelfPermission(c, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED);
        r.put("watching", !c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("token", "").isEmpty());
        call.resolve(r);
    }

    // the app's settings page: Permissions → Location → "Allow all the time"
    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", getContext().getPackageName(), null));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }
}
`);
  fs.writeFileSync(path.join(javaDir, 'LeaveWatchWorker.java'), `package com.petrokima.hr;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.HandlerThread;
import android.os.SystemClock;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;

public class LeaveWatchWorker extends Worker {
    public LeaveWatchWorker(@NonNull Context c, @NonNull WorkerParameters p) { super(c, p); }

    @NonNull
    @Override
    public Result doWork() {
        Context c = getApplicationContext();
        SharedPreferences sp = c.getSharedPreferences(LeaveWatchPlugin.PREFS, Context.MODE_PRIVATE);
        try {
            String token = sp.getString("token", "");
            long now = System.currentTimeMillis();
            if (token.isEmpty() || now > sp.getLong("untilMs", 0L)) { LeaveWatchPlugin.clear(c); return Result.success(); }
            if (now < sp.getLong("fromMs", 0L) || sp.getBoolean("reported", false)) return Result.success();
            if (!LeaveWatchPlugin.hasBackground(c)) return Result.success();
            Location l = currentLocation(c);
            if (l == null || l.getAccuracy() > 200f || isMock(l)) return Result.success();   // no reliable fix: try next time

            JSONArray offs = new JSONArray(sp.getString("offices", "[]"));
            double best = Double.MAX_VALUE;
            for (int i = 0; i < offs.length(); i++) {
                JSONObject o = offs.getJSONObject(i);
                float[] d = new float[1];
                Location.distanceBetween(l.getLatitude(), l.getLongitude(), o.getDouble("lat"), o.getDouble("lng"), d);
                best = Math.min(best, d[0] - o.optDouble("radius", 100) - Math.min(l.getAccuracy(), 150f));
            }
            if (offs.length() == 0) { LeaveWatchPlugin.clear(c); return Result.success(); }
            if (best <= 0) { sp.edit().remove("pendingAt").remove("awayCount").apply(); return Result.success(); }   // at the office

            // away: report on the 2nd reading in a row (one bad GPS reading never reports him)
            int count = sp.getInt("awayCount", 0) + 1;
            long at = sp.getLong("pendingAt", 0L);
            if (at == 0L) at = now;
            sp.edit().putInt("awayCount", count).putLong("pendingAt", at).apply();
            if (count < 2) return Result.success();

            String res = post(sp, token, l, at);
            if (res == null) return Result.success();                   // no internet / server busy: next time
            res = res.replace("\\"", "").trim();
            if (res.equals("sent") || res.equals("already")) {
                sp.edit().putBoolean("reported", true).apply();
                if (res.equals("sent")) notifyEmployee(c, sp);
            } else if (res.equals("closed")) {
                LeaveWatchPlugin.clear(c);                               // checked out / HR recorded it / period ended
            } else {
                sp.edit().remove("pendingAt").remove("awayCount").apply();   // not_away (e.g. mission day) / too_soon
            }
        } catch (Exception e) {
            /* never crash the phone — try again next time */
        }
        return Result.success();
    }

    private static boolean isMock(Location l) {
        if (Build.VERSION.SDK_INT >= 31) return l.isMock();
        return l.isFromMockProvider();
    }

    private static Location currentLocation(Context c) {
        LocationManager lm = (LocationManager) c.getSystemService(Context.LOCATION_SERVICE);
        if (lm == null) return null;
        String prov = null;
        if (Build.VERSION.SDK_INT >= 31 && lm.hasProvider(LocationManager.FUSED_PROVIDER) && lm.isProviderEnabled(LocationManager.FUSED_PROVIDER)) prov = LocationManager.FUSED_PROVIDER;
        else if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) prov = LocationManager.NETWORK_PROVIDER;
        else if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) prov = LocationManager.GPS_PROVIDER;
        if (prov == null) return null;
        final Location[] out = { null };
        final CountDownLatch latch = new CountDownLatch(1);
        try {
            if (Build.VERSION.SDK_INT >= 30) {
                CancellationSignal cs = new CancellationSignal();
                java.util.concurrent.ExecutorService ex = Executors.newSingleThreadExecutor();
                try {
                    lm.getCurrentLocation(prov, cs, ex, loc -> { out[0] = loc; latch.countDown(); });
                    if (!latch.await(45, TimeUnit.SECONDS)) cs.cancel();
                } finally {
                    ex.shutdown();
                }
            } else {
                HandlerThread ht = new HandlerThread("petrokima-leave-watch");
                ht.start();
                LocationListener ll = new LocationListener() {
                    @Override public void onLocationChanged(Location loc) { out[0] = loc; latch.countDown(); }
                    @Override public void onStatusChanged(String p, int s, Bundle b) {}
                    @Override public void onProviderEnabled(String p) {}
                    @Override public void onProviderDisabled(String p) {}
                };
                lm.requestSingleUpdate(prov, ll, ht.getLooper());
                latch.await(45, TimeUnit.SECONDS);
                lm.removeUpdates(ll);
                ht.quitSafely();
            }
            if (out[0] == null) {                                        // fall back to a fix of the last 5 minutes
                Location last = lm.getLastKnownLocation(prov);
                if (last != null && (SystemClock.elapsedRealtimeNanos() - last.getElapsedRealtimeNanos()) / 1000000L < 300000L) out[0] = last;
            }
        } catch (SecurityException e) {
            return null;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return out[0];
    }

    private static String post(SharedPreferences sp, String token, Location l, long at) {
        HttpURLConnection h = null;
        try {
            JSONObject b = new JSONObject();
            b.put("p_token", token);
            b.put("p_lat", l.getLatitude());
            b.put("p_lng", l.getLongitude());
            b.put("p_acc", Math.round(l.getAccuracy()));
            b.put("p_at_ms", at);
            h = (HttpURLConnection) new URL(sp.getString("url", "") + "/rest/v1/rpc/report_left_by_token").openConnection();
            h.setRequestMethod("POST");
            h.setConnectTimeout(20000);
            h.setReadTimeout(20000);
            h.setDoOutput(true);
            h.setRequestProperty("apikey", sp.getString("key", ""));
            h.setRequestProperty("Content-Type", "application/json");
            try (OutputStream os = h.getOutputStream()) { os.write(b.toString().getBytes(StandardCharsets.UTF_8)); }
            int code = h.getResponseCode();
            if (code < 200 || code >= 300) return null;
            try (InputStream is = h.getInputStream(); ByteArrayOutputStream bo = new ByteArrayOutputStream()) {
                byte[] buf = new byte[1024]; int n;
                while ((n = is.read(buf)) > 0) bo.write(buf, 0, n);
                return bo.toString("UTF-8");
            }
        } catch (Exception e) {
            return null;
        } finally {
            if (h != null) h.disconnect();
        }
    }

    private static void notifyEmployee(Context c, SharedPreferences sp) {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(c, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        String ch = "petrokima_watch";
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(ch) == null) {
            nm.createNotificationChannel(new NotificationChannel(ch, "Check-out reminders", NotificationManager.IMPORTANCE_HIGH));
        }
        Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        PendingIntent pi = open == null ? null : PendingIntent.getActivity(c, 8001, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder n = new NotificationCompat.Builder(c, ch)
            .setSmallIcon(R.drawable.ic_stat_petrokima)
            .setColor(0xFF1F4FB5)
            .setContentTitle(sp.getString("title", "You left without checking out"))
            .setContentText(sp.getString("body", ""))
            .setStyle(new NotificationCompat.BigTextStyle().bigText(sp.getString("body", "")))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true);
        if (pi != null) n.setContentIntent(pi);
        nm.notify(8001, n.build());
    }
}
`);
  console.log('✔ LeaveWatch added — background check while checked in (needs "Allow all the time")');
}
