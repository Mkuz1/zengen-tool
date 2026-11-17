package com.mkboard.keyboard;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.widget.ProgressBar;
import android.widget.Switch;
import android.widget.Toast;

import java.io.File;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/** Setup screen: enable keyboards, pick one, open each keyboard's settings, and try typing. */
public class MainActivity extends Activity {
    public static final String EXTRA_UPDATE = "show_update";
    private Ui ui;
    private TextView updateStatus;
    private Updater.Release pendingInstall;
    private boolean checking;
    private TextView iosStatus, bbStatus, activeStatus;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        ui = new Ui(this);
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(ui.px(16), ui.px(8), ui.px(16), ui.px(40));
        ScrollView sv = ui.scroll(col);

        col.addView(ui.title("MK Board"));
        TextView intro = ui.tv("Two keyboards in one app — an iPhone-style Liquid Glass keyboard and a "
                + "BlackBerry-style keyboard — each with its own languages, colours and settings. "
                + "Works on phones, tablets and foldables.", 15, ui.sub, false);
        intro.setPadding(ui.px(4), ui.px(2), ui.px(4), 0);
        col.addView(intro);

        LinearLayout step1 = ui.section(col, "Step 1 · Turn on", "Android will show a standard warning that "
                + "keyboards can see what you type. MK Board never sends what you type anywhere — its only "
                + "internet use is checking GitHub for new versions of the app.");
        iosStatus = ui.tv("", 15, ui.sub, false);
        bbStatus = ui.tv("", 15, ui.sub, false);
        ui.row(step1, getString(R.string.ios_kb_name), null, iosStatus, v -> openImeSettings());
        ui.row(step1, getString(R.string.bb_kb_name), null, bbStatus, v -> openImeSettings());
        ui.row(step1, "Open keyboard settings", "Enable one or both keyboards", arrow(), v -> openImeSettings());

        LinearLayout step2 = ui.section(col, "Step 2 · Choose", null);
        activeStatus = ui.tv("", 15, ui.sub, false);
        ui.row(step2, "Active keyboard", null, activeStatus, v -> pick());
        ui.row(step2, "Switch keyboard…", "Pick which keyboard to type with", arrow(), v -> pick());

        LinearLayout step3 = ui.section(col, "Step 3 · Customise", null);
        ui.row(step3, "iPhone-style settings", "Liquid Glass, languages, colours, iPad layout", arrow(),
                v -> startActivity(new Intent(this, IosSettingsActivity.class)));
        ui.row(step3, "BlackBerry-style settings", "Languages, colours, alt symbols, frets", arrow(),
                v -> startActivity(new Intent(this, BbSettingsActivity.class)));

        buildUpdates(col);

        LinearLayout step4 = ui.section(col, "Try it", null);
        EditText et = new EditText(this);
        et.setHint("Tap here and start typing…");
        et.setMinLines(3);
        et.setTextColor(ui.text);
        et.setHintTextColor(ui.sub);
        et.setBackground(null);
        et.setPadding(ui.px(16), ui.px(12), ui.px(16), ui.px(12));
        step4.addView(et, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));

        setContentView(sv);

        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 7);
        }
        if (getIntent().getBooleanExtra(EXTRA_UPDATE, false)) checkNow(true);
        else autoCheck();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent.getBooleanExtra(EXTRA_UPDATE, false)) checkNow(true);
    }

    // ------------------------------------------------------------------ updates

    private void buildUpdates(LinearLayout col) {
        LinearLayout card = ui.section(col, "Updates", "New versions are published at "
                + Updater.RELEASES_PAGE.replace("https://", "") + ". You'll get a notification when one is ready.");
        updateStatus = ui.tv("", 15, ui.sub, false);
        ui.row(card, "MK Board " + Updater.currentVersion(), "Tap to check for updates", updateStatus,
                v -> checkNow(true));
        Switch auto = new Switch(this);
        auto.setChecked(Updater.prefs(this).getBoolean(Updater.K_AUTO, true));
        auto.setOnCheckedChangeListener((b, on) -> Updater.prefs(this).edit().putBoolean(Updater.K_AUTO, on).apply());
        ui.row(card, "Check automatically", "A few times a day, in the background", auto, x -> auto.toggle());
        ui.row(card, "Release notes & downloads", null, arrow(),
                v -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(Updater.RELEASES_PAGE))));
    }

    private void autoCheck() {
        if (!Updater.prefs(this).getBoolean(Updater.K_AUTO, true)) return;
        checkNow(false);
    }

    private void checkNow(boolean interactive) {
        if (checking) return;
        checking = true;
        updateStatus.setText("Checking…");
        updateStatus.setTextColor(ui.sub);
        Updater.check(this, (r, err) -> {
            checking = false;
            if (isFinishing()) return;
            if (err != null) {
                updateStatus.setText("Offline");
                if (interactive) Toast.makeText(this, "Couldn't check for updates: " + err, Toast.LENGTH_LONG).show();
            } else if (r == null) {
                updateStatus.setText("Up to date");
                updateStatus.setTextColor(0xFF34C759);
                if (interactive) Toast.makeText(this, "You have the latest version", Toast.LENGTH_SHORT).show();
            } else {
                updateStatus.setText(r.version + " available");
                updateStatus.setTextColor(ui.accent);
                showUpdate(r);
            }
        });
    }

    private void showUpdate(Updater.Release r) {
        String notes = r.notes == null || r.notes.trim().isEmpty() ? "" : "\n\nWhat's new:\n" + r.notes.trim();
        new AlertDialog.Builder(this)
                .setTitle("Update available")
                .setMessage("MK Board " + r.version + " is ready (you have " + Updater.currentVersion() + ")."
                        + notes)
                .setPositiveButton("Update now", (d, w) -> startUpdate(r))
                .setNegativeButton("Later", null)
                .show();
    }

    private void startUpdate(Updater.Release r) {
        if (!getPackageManager().canRequestPackageInstalls()) {
            pendingInstall = r;
            new AlertDialog.Builder(this)
                    .setTitle("Allow updates")
                    .setMessage("To install updates, allow MK Board to install apps. Turn on \"Allow from this "
                            + "source\", then come back.")
                    .setPositiveButton("Open settings", (d, w) -> startActivity(new Intent(
                            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()))))
                    .setNegativeButton("Cancel", (d, w) -> pendingInstall = null)
                    .show();
            return;
        }
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(ui.px(24), ui.px(12), ui.px(24), 0);
        ProgressBar bar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        bar.setMax(1000);
        TextView pct = ui.tv("Starting download…", 14, ui.sub, false);
        box.addView(bar);
        box.addView(pct);
        AlertDialog dlg = new AlertDialog.Builder(this)
                .setTitle("Downloading MK Board " + r.version)
                .setView(box)
                .setCancelable(false)
                .show();
        Updater.download(this, r, new Updater.Progress() {
            @Override
            public void progress(long done, long total) {
                if (total > 0) {
                    bar.setProgress((int) (done * 1000 / total));
                    pct.setText((done * 100 / total) + "%  ·  " + (done / 1024) + " / " + (total / 1024) + " KB");
                } else {
                    pct.setText((done / 1024) + " KB");
                }
            }

            @Override
            public void finished(File apk, String error) {
                dlg.dismiss();
                if (apk == null) {
                    Toast.makeText(MainActivity.this, "Update failed: " + error, Toast.LENGTH_LONG).show();
                    return;
                }
                try {
                    Updater.install(MainActivity.this, apk);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Couldn't start install: " + e.getMessage(),
                            Toast.LENGTH_LONG).show();
                }
            }
        });
    }

    private TextView arrow() {
        return ui.tv("›", 22, ui.div, false);
    }

    private void openImeSettings() {
        startActivity(new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS));
    }

    private void pick() {
        InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        if (imm != null) imm.showInputMethodPicker();
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateStatus();
        if (pendingInstall != null && getPackageManager().canRequestPackageInstalls()) {
            Updater.Release r = pendingInstall;
            pendingInstall = null;
            startUpdate(r);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) updateStatus();
    }

    private void updateStatus() {
        InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        boolean ios = false, bb = false;
        if (imm != null) {
            for (InputMethodInfo i : imm.getEnabledInputMethodList()) {
                if (!i.getPackageName().equals(getPackageName())) continue;
                if (i.getServiceName().endsWith("IosKeyboardService")) ios = true;
                if (i.getServiceName().endsWith("BbKeyboardService")) bb = true;
            }
        }
        setStatus(iosStatus, ios);
        setStatus(bbStatus, bb);
        String cur = Settings.Secure.getString(getContentResolver(), Settings.Secure.DEFAULT_INPUT_METHOD);
        String label = "Other";
        if (cur != null && cur.startsWith(getPackageName())) {
            label = cur.endsWith("IosKeyboardService") ? "iPhone style" : "BlackBerry style";
            activeStatus.setTextColor(0xFF34C759);
        } else {
            activeStatus.setTextColor(ui.sub);
        }
        activeStatus.setText(label);
    }

    private void setStatus(TextView t, boolean on) {
        t.setText(on ? "On ✓" : "Off");
        t.setTextColor(on ? 0xFF34C759 : ui.sub);
    }
}
