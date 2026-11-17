package com.zengen.keyboards;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.text.Editable;
import android.text.InputFilter;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.GridLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.SeekBar;
import android.widget.TextView;

import java.util.Locale;

/** Swatches + hue/saturation/brightness sliders + hex entry. */
final class ColorPickerDialog {
    interface Callback {
        void onColor(int color);
    }

    private static final int[] PALETTE = {
            0xFFFFFFFF, 0xFFF2F2F7, 0xFFD1D4DB, 0xFFACB1BB, 0xFF8E8E93, 0xFF6B6B6E, 0xFF3A3A3C, 0xFF000000,
            0xFFFF3B30, 0xFFFF9500, 0xFFFFCC00, 0xFF34C759, 0xFF00C7BE, 0xFF30B0C7, 0xFF007AFF, 0xFF5856D6,
            0xFFAF52DE, 0xFFFF2D55, 0xFFA2845E, 0xFFFFD1DC, 0xFFFFE4C4, 0xFFFFF5BA, 0xFFD4F5D4, 0xFFCFE8FF,
            0xFFE3DDF5, 0xFF0A1A33, 0xFF17325E, 0xFF124A30, 0xFF4A1010, 0xFF35205C, 0xFF4A3A14, 0xFFD4AF37,
    };

    static void show(Context ctx, String title, int initial, Callback cb) {
        float dp = ctx.getResources().getDisplayMetrics().density;
        final int[] cur = {initial | 0xFF000000};
        final float[] hsv = new float[3];
        Color.colorToHSV(cur[0], hsv);
        final boolean[] updating = {false};

        LinearLayout root = new LinearLayout(ctx);
        root.setOrientation(LinearLayout.VERTICAL);
        int p = (int) (20 * dp);
        root.setPadding(p, (int) (8 * dp), p, 0);

        final View preview = new View(ctx);
        final GradientDrawable pd = new GradientDrawable();
        pd.setCornerRadius(12 * dp);
        pd.setStroke((int) dp, 0x33000000);
        pd.setColor(cur[0]);
        preview.setBackground(pd);
        root.addView(preview, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, (int) (56 * dp)));

        GridLayout grid = new GridLayout(ctx);
        grid.setColumnCount(8);
        LinearLayout.LayoutParams glp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
        glp.gravity = Gravity.CENTER_HORIZONTAL;
        glp.topMargin = (int) (12 * dp);
        root.addView(grid, glp);

        final SeekBar hue = new SeekBar(ctx), sat = new SeekBar(ctx), val = new SeekBar(ctx);
        final EditText hex = new EditText(ctx);

        final Runnable[] sync = new Runnable[1];
        sync[0] = () -> {
            updating[0] = true;
            pd.setColor(cur[0]);
            hue.setProgress((int) hsv[0]);
            sat.setProgress((int) (hsv[1] * 100));
            val.setProgress((int) (hsv[2] * 100));
            String h = String.format(Locale.ROOT, "%06X", cur[0] & 0xFFFFFF);
            if (!h.equalsIgnoreCase(hex.getText().toString())) hex.setText(h);
            updating[0] = false;
        };

        int sw = (int) (30 * dp), m = (int) (3 * dp);
        for (int c : PALETTE) {
            View s = new View(ctx);
            GradientDrawable g = new GradientDrawable();
            g.setShape(GradientDrawable.OVAL);
            g.setColor(c);
            g.setStroke((int) dp, 0x44000000);
            s.setBackground(g);
            GridLayout.LayoutParams lp = new GridLayout.LayoutParams();
            lp.width = sw;
            lp.height = sw;
            lp.setMargins(m, m, m, m);
            s.setOnClickListener(v -> {
                cur[0] = c;
                Color.colorToHSV(c, hsv);
                sync[0].run();
            });
            grid.addView(s, lp);
        }

        GradientDrawable rainbow = new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{0xFFFF0000, 0xFFFFFF00, 0xFF00FF00, 0xFF00FFFF, 0xFF0000FF, 0xFFFF00FF, 0xFFFF0000});
        rainbow.setCornerRadius(6 * dp);
        hue.setMax(360);
        hue.setProgressDrawable(rainbow);
        sat.setMax(100);
        val.setMax(100);

        addSlider(ctx, root, "Hue", hue, dp);
        addSlider(ctx, root, "Saturation", sat, dp);
        addSlider(ctx, root, "Brightness", val, dp);

        SeekBar.OnSeekBarChangeListener l = new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar sb, int progress, boolean fromUser) {
                if (updating[0] || !fromUser) return;
                hsv[0] = hue.getProgress();
                hsv[1] = sat.getProgress() / 100f;
                hsv[2] = val.getProgress() / 100f;
                cur[0] = Color.HSVToColor(hsv);
                sync[0].run();
            }

            @Override
            public void onStartTrackingTouch(SeekBar sb) {
            }

            @Override
            public void onStopTrackingTouch(SeekBar sb) {
            }
        };
        hue.setOnSeekBarChangeListener(l);
        sat.setOnSeekBarChangeListener(l);
        val.setOnSeekBarChangeListener(l);

        LinearLayout hexRow = new LinearLayout(ctx);
        hexRow.setGravity(Gravity.CENTER_VERTICAL);
        TextView hash = new TextView(ctx);
        hash.setText("Hex  #");
        hash.setTextSize(16);
        hexRow.addView(hash);
        hex.setSingleLine();
        hex.setFilters(new InputFilter[]{new InputFilter.LengthFilter(6), new InputFilter.AllCaps()});
        hex.setTextSize(16);
        hexRow.addView(hex, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        root.addView(hexRow);
        hex.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int a, int b, int c) {
            }

            @Override
            public void onTextChanged(CharSequence s, int a, int b, int c) {
            }

            @Override
            public void afterTextChanged(Editable e) {
                if (updating[0] || e.length() != 6) return;
                try {
                    cur[0] = 0xFF000000 | Integer.parseInt(e.toString(), 16);
                    Color.colorToHSV(cur[0], hsv);
                    sync[0].run();
                } catch (NumberFormatException ignored) {
                }
            }
        });

        sync[0].run();
        ScrollView sv = new ScrollView(ctx);
        sv.addView(root);
        new AlertDialog.Builder(ctx)
                .setTitle(title)
                .setView(sv)
                .setPositiveButton("Apply", (d, w) -> cb.onColor(cur[0]))
                .setNegativeButton("Cancel", null)
                .show();
    }

    private static void addSlider(Context ctx, LinearLayout root, String label, SeekBar sb, float dp) {
        TextView t = new TextView(ctx);
        t.setText(label);
        t.setTextSize(13);
        t.setPadding(0, (int) (12 * dp), 0, (int) (2 * dp));
        root.addView(t);
        root.addView(sb, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, (int) (32 * dp)));
    }

    private ColorPickerDialog() {
    }
}
