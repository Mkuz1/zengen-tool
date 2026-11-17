package com.zengen.keyboards;

import android.app.Activity;
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
    private Ui ui;
    private TextView iosStatus, bbStatus, activeStatus;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        ui = new Ui(this);
        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(ui.bg);
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(ui.px(16), ui.px(8), ui.px(16), ui.px(40));
        sv.addView(col);

        col.addView(ui.title("Zen Keyboards"));
        TextView intro = ui.tv("Two keyboards in one app — an iPhone-style keyboard and a BlackBerry-style "
                + "keyboard — each with its own languages, colours and settings.", 15, ui.sub, false);
        intro.setPadding(ui.px(4), ui.px(2), ui.px(4), 0);
        col.addView(intro);

        LinearLayout step1 = ui.section(col, "Step 1 · Turn on", "Android will show a standard warning that "
                + "keyboards can see what you type. Zen Keyboards has no internet permission, so nothing ever "
                + "leaves your phone.");
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
        ui.row(step3, "iPhone-style settings", "Languages, colours, predictive, sounds", arrow(),
                v -> startActivity(new Intent(this, IosSettingsActivity.class)));
        ui.row(step3, "BlackBerry-style settings", "Languages, colours, alt symbols, frets", arrow(),
                v -> startActivity(new Intent(this, BbSettingsActivity.class)));

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
