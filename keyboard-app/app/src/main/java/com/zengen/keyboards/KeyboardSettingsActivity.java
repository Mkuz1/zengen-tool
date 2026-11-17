package com.zengen.keyboards;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CheckBox;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.SeekBar;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

/** Settings for one keyboard. Each keyboard has its own instance with its own preferences. */
public abstract class KeyboardSettingsActivity extends Activity {

    protected abstract String kind();

    private KbPrefs prefs;
    private Ui ui;
    private KeyboardView preview;
    private final List<Runnable> refreshers = new ArrayList<>();

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        prefs = new KbPrefs(this, kind());
        ui = new Ui(this);
        build();
    }

    private boolean ios() {
        return prefs.isIos();
    }

    private void build() {
        refreshers.clear();
        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(ui.bg);
        sv.setFillViewport(true);
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(ui.px(16), ui.px(8), ui.px(16), ui.px(40));
        sv.addView(col);

        TextView back = ui.tv("‹ Zen Keyboards", 17, ui.accent, false);
        back.setPadding(0, ui.px(10), 0, 0);
        back.setOnClickListener(v -> finish());
        col.addView(back);
        col.addView(ui.title(ios() ? "iPhone Style" : "BlackBerry Style"));
        TextView sub = ui.tv(ios() ? "Zen Glass keyboard · settings apply instantly"
                : "Zen Classic keyboard · settings apply instantly", 14, ui.sub, false);
        sub.setPadding(ui.px(4), 0, 0, ui.px(6));
        col.addView(sub);

        // ---- live preview
        FrameLayout pf = new FrameLayout(this);
        pf.setBackground(ui.rounded(ui.card, 14));
        pf.setClipToOutline(true);
        preview = new KeyboardView(this, ios() ? KeyboardView.IOS : KeyboardView.BB);
        preview.previewOnly = true;
        pf.addView(preview, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));
        LinearLayout.LayoutParams plp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
        plp.topMargin = ui.px(10);
        col.addView(pf, plp);
        refreshPreview();

        buildLanguages(col);
        buildThemes(col);
        buildColours(col);
        buildSize(col);
        buildTyping(col);
        buildSound(col);

        LinearLayout reset = ui.section(col, null, null);
        ui.row(reset, "Reset keyboard settings", "Restores default colours and options", null, v ->
                new AlertDialog.Builder(this)
                        .setTitle("Reset settings?")
                        .setMessage("Colours, size and typing options for this keyboard return to defaults. "
                                + "Your languages are kept.")
                        .setPositiveButton("Reset", (d, w) -> {
                            prefs.resetAll();
                            build();
                        })
                        .setNegativeButton("Cancel", null)
                        .show());
        ((TextView) ((LinearLayout) ((LinearLayout) reset.getChildAt(0)).getChildAt(0)).getChildAt(0))
                .setTextColor(0xFFFF3B30);
        ui.row(reset, "Clear learned words", "Forget words this keyboard learned from your typing", null, v -> {
            new Suggest(this, kind()).clear();
            Toast.makeText(this, "Learned words cleared", Toast.LENGTH_SHORT).show();
        });

        setContentView(sv);
    }

    private void refreshPreview() {
        if (preview == null) return;
        preview.setTheme(prefs.theme());
        preview.scale = prefs.height();
        preview.showSuggest = prefs.b(KbPrefs.K_PREDICT);
        preview.showAltLabels = prefs.b(KbPrefs.K_SHOWALT);
        preview.shadows = prefs.b(KbPrefs.K_SHADOW);
        Languages.Lang l = Languages.get(prefs.curLang());
        preview.locale = l.locale;
        Layouts.Opts o = new Layouts.Opts();
        o.multiLang = prefs.langs().size() > 1;
        preview.setLayout(ios() ? Layouts.ios(l, Layouts.LETTERS, o) : Layouts.bb(l, Layouts.LETTERS, o));
        preview.shifted = ios() && l.hasCase;
        preview.spaceLabel = ios() ? l.space : (o.multiLang ? l.nativeName : "");
        preview.setSuggestions(new Suggest(this, kind()).starters(l.code).clone());
        preview.requestLayout();
        preview.invalidate();
    }

    // ------------------------------------------------------------------ languages

    private void buildLanguages(LinearLayout col) {
        LinearLayout card = ui.section(col, "Languages",
                ios() ? "Tap 🌐 on the keyboard to switch language; hold it for the full list."
                        : "Tap 🌐 (or hold the space bar) to switch language.");
        List<String> enabled = prefs.langs();
        for (Languages.Lang l : Languages.ALL) {
            CheckBox cb = new CheckBox(this);
            cb.setChecked(enabled.contains(l.code));
            cb.setClickable(false);
            cb.setFocusable(false);
            final LinearLayout[] rowRef = new LinearLayout[1];
            rowRef[0] = ui.row(card, l.nativeName, l.name + (l.code.equals(prefs.curLang()) ? " · active" : ""),
                    cb, v -> {
                        List<String> cur = prefs.langs();
                        if (cur.contains(l.code)) {
                            if (cur.size() == 1) {
                                Toast.makeText(this, "Keep at least one language", Toast.LENGTH_SHORT).show();
                                return;
                            }
                            cur.remove(l.code);
                        } else {
                            cur.add(l.code);
                        }
                        prefs.setLangs(cur);
                        cb.setChecked(cur.contains(l.code));
                        refreshPreview();
                    });
            rowRef[0].setOnLongClickListener(v -> {
                List<String> cur = prefs.langs();
                if (!cur.contains(l.code)) {
                    cur.add(l.code);
                    prefs.setLangs(cur);
                }
                prefs.setCurLang(l.code);
                build();
                Toast.makeText(this, l.name + " is now the active language", Toast.LENGTH_SHORT).show();
                return true;
            });
        }
        TextView hint = ui.tv("Long-press a language to make it the active one.", 13, ui.sub, false);
        hint.setPadding(ui.px(16), ui.px(4), ui.px(16), 0);
        col.addView(hint);
    }

    // ------------------------------------------------------------------ themes

    private void buildThemes(LinearLayout col) {
        TextView h = ui.tv("THEMES", 13, ui.sub, false);
        h.setPadding(ui.px(16), ui.px(22), ui.px(16), ui.px(7));
        col.addView(h);
        HorizontalScrollView hs = new HorizontalScrollView(this);
        hs.setHorizontalScrollBarEnabled(false);
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        hs.addView(row);
        for (Presets.Preset p : Presets.forKind(kind())) {
            LinearLayout chip = new LinearLayout(this);
            chip.setOrientation(LinearLayout.VERTICAL);
            chip.setGravity(Gravity.CENTER_HORIZONTAL);
            chip.setPadding(ui.px(6), ui.px(6), ui.px(6), ui.px(6));
            ThemeSwatch sw = new ThemeSwatch(p);
            chip.addView(sw, new LinearLayout.LayoutParams(ui.px(84), ui.px(56)));
            TextView name = ui.tv(p.name, 12, ui.text, false);
            name.setGravity(Gravity.CENTER);
            name.setPadding(0, ui.px(4), 0, 0);
            chip.addView(name);
            chip.setOnClickListener(v -> {
                prefs.applyPreset(p);
                for (Runnable r : refreshers) r.run();
                refreshPreview();
            });
            refreshers.add(() -> sw.setSelected(p.name.equals(prefs.preset().name)
                    && !prefs.sp.contains(KbPrefs.K_BG) && !prefs.sp.contains(KbPrefs.K_KEY)));
            row.addView(chip);
        }
        col.addView(hs);
        for (Runnable r : refreshers) r.run();
    }

    private final class ThemeSwatch extends View {
        final Presets.Preset p;
        final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        boolean sel;

        ThemeSwatch(Presets.Preset p) {
            super(KeyboardSettingsActivity.this);
            this.p = p;
        }

        @Override
        public void setSelected(boolean s) {
            sel = s;
            invalidate();
        }

        @Override
        protected void onDraw(Canvas c) {
            float w = getWidth(), h = getHeight(), d = ui.dp;
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(p.bg);
            c.drawRoundRect(0, 0, w, h, 10 * d, 10 * d, paint);
            float kw = (w - 10 * d) / 4f, kh = (h - 12 * d) / 3f;
            for (int r = 0; r < 3; r++) {
                for (int k = 0; k < 4; k++) {
                    boolean special = r == 2 && (k == 0 || k == 3);
                    paint.setColor(special ? (k == 3 ? p.accent : p.special) : p.key);
                    float x = 5 * d + k * kw, y = 4 * d + r * kh;
                    c.drawRoundRect(x + d, y + d, x + kw - d, y + kh - d, 3 * d, 3 * d, paint);
                }
            }
            if (!ios()) {
                paint.setColor(p.fret);
                for (int r = 1; r < 3; r++) c.drawRect(0, 4 * d + r * kh - d * 0.6f, w, 4 * d + r * kh + d * 0.6f, paint);
            }
            if (sel) {
                paint.setStyle(Paint.Style.STROKE);
                paint.setStrokeWidth(3 * d);
                paint.setColor(ui.accent);
                c.drawRoundRect(1.5f * d, 1.5f * d, w - 1.5f * d, h - 1.5f * d, 10 * d, 10 * d, paint);
            }
        }
    }

    // ------------------------------------------------------------------ custom colours

    private void buildColours(LinearLayout col) {
        LinearLayout card = ui.section(col, "Custom colours", "Pick any colour for each part of the keyboard. "
                + "Choosing a theme above resets these.");
        colourRow(card, "Keyboard background", KbPrefs.K_BG);
        colourRow(card, ios() ? "Letter keys" : "Keycaps", KbPrefs.K_KEY);
        colourRow(card, "Function keys", KbPrefs.K_SPECIAL);
        colourRow(card, "Key text", KbPrefs.K_TEXT);
        colourRow(card, ios() ? "Accent (action key & highlights)" : "Accent (highlights & alt mode)",
                KbPrefs.K_ACCENT);
        if (!ios()) {
            colourRow(card, "Chrome fret lines", KbPrefs.K_FRET);
            colourRow(card, "Alt symbols", KbPrefs.K_ALT);
        }
    }

    private void colourRow(LinearLayout card, String label, String key) {
        View sw = new View(this);
        GradientDrawable g = new GradientDrawable();
        g.setShape(GradientDrawable.OVAL);
        g.setStroke(ui.px(1), 0x55000000);
        sw.setBackground(g);
        sw.setLayoutParams(new LinearLayout.LayoutParams(ui.px(30), ui.px(30)));
        Runnable upd = () -> g.setColor(prefs.color(key));
        upd.run();
        refreshers.add(upd);
        ui.row(card, label, null, sw, v -> ColorPickerDialog.show(this, label, prefs.color(key), c -> {
            prefs.setColor(key, c);
            for (Runnable r : refreshers) r.run();
            refreshPreview();
        }));
    }

    // ------------------------------------------------------------------ size

    private void buildSize(LinearLayout col) {
        LinearLayout card = ui.section(col, "Keyboard size", null);
        TextView val = ui.tv("", 15, ui.sub, false);
        SeekBar sb = new SeekBar(this);
        sb.setMax(50);
        sb.setProgress(prefs.sp.getInt(KbPrefs.K_HEIGHT, 100) - 80);
        val.setText(prefs.sp.getInt(KbPrefs.K_HEIGHT, 100) + "%");
        ui.row(card, "Height", null, val, null);
        LinearLayout holder = new LinearLayout(this);
        holder.setPadding(ui.px(8), 0, ui.px(8), ui.px(10));
        holder.addView(sb, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ui.px(36)));
        card.addView(holder);
        sb.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar s, int p, boolean u) {
                val.setText((80 + p) + "%");
                if (u) {
                    prefs.sp.edit().putInt(KbPrefs.K_HEIGHT, 80 + p).apply();
                    refreshPreview();
                }
            }

            @Override
            public void onStartTrackingTouch(SeekBar s) {
            }

            @Override
            public void onStopTrackingTouch(SeekBar s) {
            }
        });
        toggle(card, ios() ? "Key shadows" : "Sculpted key shadows", null, KbPrefs.K_SHADOW);
        if (!ios()) toggle(card, "Show alt symbols on keys", "Numbers & symbols printed above letters",
                KbPrefs.K_SHOWALT);
    }

    // ------------------------------------------------------------------ typing

    private void buildTyping(LinearLayout col) {
        LinearLayout card = ui.section(col, "Typing", null);
        toggle(card, "Auto-Capitalisation", null, KbPrefs.K_AUTOCAP);
        toggle(card, ios() ? "Enable Caps Lock" : "Caps lock (double-tap shift)",
                ios() ? "Double-tap shift" : null, KbPrefs.K_CAPSLOCK);
        toggle(card, "“.” Shortcut", "Double-tap the space bar to insert a full stop", KbPrefs.K_DOUBLESPACE);
        toggle(card, ios() ? "Predictive" : "Word suggestions", null, KbPrefs.K_PREDICT);
        toggle(card, "Character Preview", "Pop-up of each key as you type", KbPrefs.K_PREVIEW);
        toggle(card, ios() ? "Return to letters after space" : "Close symbol page after one symbol",
                null, KbPrefs.K_SYM_RETURN);
        TextView tips = ui.tv(ios()
                        ? "Hold a letter for accents · drag on the space bar to move the cursor · hold delete to erase words."
                        : "Tap alt for the blue symbol on a key, double-tap alt to lock · hold a key for accents · "
                        + "drag on the space bar to move the cursor.",
                13, ui.sub, false);
        tips.setPadding(ui.px(16), ui.px(7), ui.px(16), 0);
        col.addView(tips);
    }

    private void buildSound(LinearLayout col) {
        LinearLayout card = ui.section(col, "Sounds & haptics", null);
        toggle(card, "Keyboard clicks", null, KbPrefs.K_SOUND);
        toggle(card, ios() ? "Haptic feedback" : "Vibrate on key press", null, KbPrefs.K_VIBRATE);
    }

    private void toggle(LinearLayout card, String label, String detail, String key) {
        Switch s = new Switch(this);
        s.setChecked(prefs.b(key));
        s.setOnCheckedChangeListener((b, v) -> {
            prefs.sp.edit().putBoolean(key, v).apply();
            refreshPreview();
        });
        ui.row(card, label, detail, s, v -> s.toggle());
    }
}
