package com.mkboard.keyboard;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * In-app updates from GitHub Releases. Checks the latest release of the MK Board repository, downloads its APK
 * and hands it to Android's package installer. Only release metadata and the APK are downloaded; nothing typed on
 * the keyboard is ever sent anywhere.
 */
public final class Updater {
    public static final String REPO = "mkuz1/MK-Board";
    public static final String RELEASES_PAGE = "https://github.com/" + REPO + "/releases";
    private static final String API = "https://api.github.com/repos/" + REPO + "/releases/latest";
    private static final String PREFS = "updater";
    public static final String K_AUTO = "auto_check";
    private static final String K_LAST = "last_check", K_NOTIFIED = "notified_version", K_LATEST = "latest";
    private static final String CHANNEL = "updates";
    private static final long INTERVAL = 6L * 60 * 60 * 1000;

    public static final class Release {
        public String tag, version, apkUrl, notes, pageUrl;
        public long size;
    }

    public interface Callback {
        /** newer == null means already up to date. */
        void done(Release newer, String error);
    }

    public interface Progress {
        void progress(long done, long total);

        void finished(File apk, String error);
    }

    private static Handler main;

    private static synchronized Handler main() {
        if (main == null) main = new Handler(Looper.getMainLooper());
        return main;
    }

    public static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static String currentVersion() {
        return BuildConfig.VERSION_NAME;
    }

    /** Compares dotted versions ("2.10.1" > "2.9"); a leading "v" is ignored. */
    public static int compare(String a, String b) {
        String[] x = a.replaceFirst("^[vV]", "").split("[.\\-+]");
        String[] y = b.replaceFirst("^[vV]", "").split("[.\\-+]");
        for (int i = 0; i < Math.max(x.length, y.length); i++) {
            int p = i < x.length ? num(x[i]) : 0, q = i < y.length ? num(y[i]) : 0;
            if (p != q) return Integer.compare(p, q);
        }
        return 0;
    }

    private static int num(String s) {
        try {
            return Integer.parseInt(s.replaceAll("\\D.*$", ""));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static String read(InputStream in) throws IOException {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
        return bo.toString(StandardCharsets.UTF_8.name());
    }

    private static HttpURLConnection open(String url) throws IOException {
        HttpURLConnection con = (HttpURLConnection) new URL(url).openConnection();
        con.setRequestProperty("User-Agent", "MKBoard-Updater/" + currentVersion());
        con.setConnectTimeout(12000);
        con.setReadTimeout(20000);
        con.setInstanceFollowRedirects(true);
        return con;
    }

    /** Blocking: returns the latest published release, or null if there is none yet. */
    static Release fetchLatest() throws Exception {
        HttpURLConnection con = open(API);
        con.setRequestProperty("Accept", "application/vnd.github+json");
        int code = con.getResponseCode();
        if (code == 404) return null;
        if (code != 200) throw new IOException("GitHub returned HTTP " + code);
        return parse(read(con.getInputStream()));
    }

    /** Parses a GitHub "latest release" response; null for drafts / pre-releases. */
    static Release parse(String json) throws Exception {
        JSONObject o = new JSONObject(json);
        if (o.optBoolean("draft") || o.optBoolean("prerelease")) return null;
        Release r = new Release();
        r.tag = o.optString("tag_name", "");
        r.version = r.tag.replaceFirst("^[vV]", "");
        r.notes = o.optString("body", "");
        r.pageUrl = o.optString("html_url", RELEASES_PAGE);
        JSONArray as = o.optJSONArray("assets");
        if (as != null) {
            for (int i = 0; i < as.length(); i++) {
                JSONObject a = as.getJSONObject(i);
                if (a.optString("name").toLowerCase().endsWith(".apk")) {
                    r.apkUrl = a.optString("browser_download_url");
                    r.size = a.optLong("size");
                    break;
                }
            }
        }
        return r;
    }

    /** Checks GitHub on a background thread and reports on the main thread. */
    public static void check(Context ctx, Callback cb) {
        Context c = ctx.getApplicationContext();
        new Thread(() -> {
            Release newer = null;
            String err = null;
            try {
                Release r = fetchLatest();
                prefs(c).edit().putLong(K_LAST, System.currentTimeMillis())
                        .putString(K_LATEST, r == null ? "" : r.version).apply();
                if (r != null && r.apkUrl != null && compare(r.version, currentVersion()) > 0) newer = r;
            } catch (Exception e) {
                err = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            }
            final Release fr = newer;
            final String fe = err;
            main().post(() -> cb.done(fr, fe));
        }, "mkboard-update-check").start();
    }

    /** Throttled automatic check; posts a notification once per new version. */
    public static void backgroundCheck(Context ctx) {
        Context c = ctx.getApplicationContext();
        SharedPreferences sp = prefs(c);
        if (!sp.getBoolean(K_AUTO, true)) return;
        if (System.currentTimeMillis() - sp.getLong(K_LAST, 0) < INTERVAL) return;
        sp.edit().putLong(K_LAST, System.currentTimeMillis()).apply();
        check(c, (r, err) -> {
            if (r == null) return;
            if (r.version.equals(sp.getString(K_NOTIFIED, ""))) return;
            sp.edit().putString(K_NOTIFIED, r.version).apply();
            notifyUpdate(c, r);
        });
    }

    static void notifyUpdate(Context c, Release r) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 33
                && c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
            return;
        nm.createNotificationChannel(new NotificationChannel(CHANNEL, "App updates",
                NotificationManager.IMPORTANCE_DEFAULT));
        Intent open = new Intent(c, MainActivity.class).putExtra(MainActivity.EXTRA_UPDATE, true)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 1, open,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification n = new Notification.Builder(c, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat_update)
                .setContentTitle("MK Board " + r.version + " is available")
                .setContentText("Tap to update your keyboards")
                .setContentIntent(pi)
                .setAutoCancel(true)
                .build();
        nm.notify(42, n);
    }

    /** Downloads the release APK to the app's cache, reporting progress on the main thread. */
    public static void download(Context ctx, Release r, Progress cb) {
        Context c = ctx.getApplicationContext();
        new Thread(() -> {
            File dir = new File(c.getCacheDir(), "updates");
            File out = new File(dir, "MKBoard-" + r.version + ".apk");
            String err = null;
            try {
                dir.mkdirs();
                File[] old = dir.listFiles();
                if (old != null) for (File f : old) f.delete();
                HttpURLConnection con = open(r.apkUrl);
                int code = con.getResponseCode();
                if (code != 200) throw new IOException("Download failed (HTTP " + code + ")");
                long total = con.getContentLengthLong() > 0 ? con.getContentLengthLong() : r.size;
                try (InputStream in = con.getInputStream(); OutputStream o = new FileOutputStream(out)) {
                    byte[] buf = new byte[64 * 1024];
                    long done = 0, lastPost = 0;
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        o.write(buf, 0, n);
                        done += n;
                        if (done - lastPost > 64 * 1024) {
                            lastPost = done;
                            final long d = done;
                            main().post(() -> cb.progress(d, total));
                        }
                    }
                }
                verify(c, out);
            } catch (Exception e) {
                err = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
                out.delete();
            }
            final String fe = err;
            main().post(() -> cb.finished(fe == null ? out : null, fe));
        }, "mkboard-update-download").start();
    }

    /** Refuses anything that is not a newer build of this very app. */
    private static void verify(Context c, File apk) throws IOException {
        PackageManager pm = c.getPackageManager();
        PackageInfo pi = pm.getPackageArchiveInfo(apk.getPath(), 0);
        if (pi == null || !c.getPackageName().equals(pi.packageName))
            throw new IOException("Downloaded file is not an MK Board update");
        if (pi.getLongVersionCode() <= BuildConfig.VERSION_CODE)
            throw new IOException("Downloaded build is not newer than this one");
    }

    /** Starts installation; Android shows its own confirmation screen (handled by InstallReceiver). */
    public static void install(Context ctx, File apk) throws IOException {
        Context c = ctx.getApplicationContext();
        PackageInstaller installer = c.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams params =
                new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        params.setAppPackageName(c.getPackageName());
        if (Build.VERSION.SDK_INT >= 31) {
            params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED);
        }
        int id = installer.createSession(params);
        try (PackageInstaller.Session s = installer.openSession(id)) {
            try (InputStream in = new FileInputStream(apk);
                 OutputStream out = s.openWrite("base.apk", 0, apk.length())) {
                byte[] buf = new byte[64 * 1024];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                s.fsync(out);
            }
            Intent i = new Intent(c, InstallReceiver.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT
                    | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
            PendingIntent pi = PendingIntent.getBroadcast(c, id, i, flags);
            s.commit(pi.getIntentSender());
        }
    }

    private Updater() {
    }
}
