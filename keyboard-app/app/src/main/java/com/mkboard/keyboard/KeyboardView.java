package com.mkboard.keyboard;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.res.Configuration;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.widget.PopupWindow;

/**
 * Canvas-drawn keyboard. Renders either the iPhone-style ("glass") look or the
 * BlackBerry-style ("classic" keycaps with chrome frets) look, and handles touch,
 * key previews, long-press alternates, delete repeat and space-bar cursor drag.
 */
public class KeyboardView extends View {

    public interface Listener {
        void onPress(Key k);

        void onKey(Key k);

        String[] alternates(Key k);

        boolean onLongPress(Key k);

        void onAltSelected(Key k, int index);

        void onRepeat(Key k, int count);

        void onCursorMove(int dir);

        void onSuggestion(int index);

        void onFlick(Key k);
    }

    public static final int IOS = 0, BB = 1;

    private final int style;
    private final float dp;
    private KbTheme theme;
    private KeyboardLayout layout;
    private Listener listener;

    public float scale = 1f;
    public boolean shifted, capsLock, altOn, altLock;
    public boolean showAltLabels = true, showPreview = true, showSuggest = true, shadows = true;
    public boolean previewOnly;
    public boolean enterAction;
    public String spaceLabel = "";
    /** Liquid Glass rendering (iPhone style). */
    public boolean glass;
    /** Draw the glass panel tint inside the view (settings preview); in the IME the window background does it. */
    public boolean drawPanel = true;
    /** Whether the system blurs what is behind the keyboard. */
    public boolean blurAvailable = true;
    /** 0 = frosted, 1 = clear. */
    public float glassT = 0.55f;
    /** Max width for keys (centred) on wide screens; 0 = full width. */
    public float maxContentWidth;
    private float contentLeft, contentW;
    private float downY;
    private boolean flick;
    private final Paint rim = new Paint(Paint.ANTI_ALIAS_FLAG);
    public java.util.Locale locale = java.util.Locale.getDefault();
    private String[] suggestions = new String[3];

    private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint text = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint icon = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Typeface regular = Typeface.create("sans-serif", Typeface.NORMAL);
    private final Typeface medium = Typeface.create("sans-serif-medium", Typeface.NORMAL);
    private final Typeface bold = Typeface.create("sans-serif", Typeface.BOLD);

    private float rowH, vgap, hgap, side, topPad, bottomPad, suggestH, radius;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Key cur;
    private int pointerId = -1;
    private boolean longFired, altsMode, spaceDrag, suggestDown;
    private int suggestIdx, repeatCount, altSel;
    private float downX, lastDragX, altOriginX, altCellW;
    private String[] altItems;

    private PopupWindow popup;
    private PopView pop;
    private final int[] loc = new int[2];

    public KeyboardView(Context c, int style) {
        super(c);
        this.style = style;
        this.dp = c.getResources().getDisplayMetrics().density;
        text.setTextAlign(Paint.Align.CENTER);
        theme = new KbTheme(0xFFD1D4DB, 0xFFFFFFFF, 0xFFACB1BB, 0xFF000000, 0xFF007AFF, 0xFF999999, 0xFF999999);
    }

    public void setListener(Listener l) {
        listener = l;
    }

    public void setTheme(KbTheme t) {
        theme = t;
        invalidate();
    }

    public void setLayout(KeyboardLayout l) {
        layout = l;
        cancelTouch();
        requestLayout();
        computeKeys();
        invalidate();
    }

    public void setSuggestions(String[] s) {
        suggestions = s == null ? new String[3] : s;
        invalidate();
    }

    // ------------------------------------------------------------------ geometry

    private float rowUnits() {
        float rows = 0;
        if (layout != null) for (KeyboardLayout.Row r : layout.rows) rows += r.h;
        else rows = 4;
        return rows;
    }

    /** Sizes adapt to phone / landscape / tablet / unfolded foldable, and never exceed ~half the screen. */
    private void metrics() {
        Configuration cfg = getResources().getConfiguration();
        boolean land = cfg.orientation == Configuration.ORIENTATION_LANDSCAPE;
        boolean tablet = cfg.smallestScreenWidthDp >= 600;
        if (style == IOS) {
            float base = tablet ? (land ? 66 : 60) : (land ? 42 : 54);
            float k = base / 54f;
            rowH = dp * base * scale;
            vgap = dp * 11 * k * scale;
            hgap = dp * (tablet ? 8 : 6);
            side = dp * (tablet ? 6 : 3);
            topPad = dp * (glass ? 10 : 6) * scale;
            bottomPad = dp * (glass ? 4 : 2);
            suggestH = showSuggest ? dp * (land && !tablet ? 36 : 42) * scale : dp * 4;
            radius = dp * 5.5f;
        } else {
            float base = tablet ? (land ? 58 : 56) : (land ? 40 : 50);
            float k = base / 50f;
            rowH = dp * base * scale;
            vgap = dp * 8 * k * scale;
            hgap = dp * 5;
            side = dp * 4;
            topPad = dp * 4;
            bottomPad = dp * 4;
            suggestH = showSuggest ? dp * (land && !tablet ? 34 : 38) * scale : 0;
            radius = dp * 5;
        }
        if (cfg.screenHeightDp > 0) {
            float cap = cfg.screenHeightDp * dp * (land ? 0.56f : 0.46f);
            float rows = rowUnits();
            float total = suggestH + topPad + rows * rowH + bottomPad;
            if (total > cap) {
                float f = Math.max(0.6f, (cap - suggestH - topPad - bottomPad) / (rows * rowH));
                rowH *= f;
                vgap *= f;
            }
        }
    }

    private int desiredHeight() {
        metrics();
        return (int) (suggestH + topPad + rowUnits() * rowH + bottomPad);
    }

    @Override
    protected void onMeasure(int w, int h) {
        setMeasuredDimension(MeasureSpec.getSize(w), desiredHeight());
    }

    @Override
    protected void onSizeChanged(int w, int h, int ow, int oh) {
        computeKeys();
    }

    private void computeKeys() {
        metrics();
        int W = getWidth();
        if (W == 0 || layout == null) return;
        float cols = layout.columns;
        contentW = maxContentWidth > 0 ? Math.min(W, maxContentWidth) : W;
        contentLeft = (W - contentW) / 2f;
        float u = (contentW - 2 * side) / cols;
        float y = suggestH + topPad;
        for (KeyboardLayout.Row row : layout.rows) {
            float rh = rowH * row.h;
            float fixed = 0;
            int flexN = 0;
            for (Key k : row.keys) {
                if (k.flex) flexN++;
                else fixed += k.weight;
            }
            float sc = 1f, fw = 0f;
            if (fixed > cols) sc = cols / fixed;
            else if (flexN > 0) fw = (cols - fixed) / flexN;
            float total = fixed * sc + fw * flexN;
            float x = contentLeft + side + (cols - total) / 2f * u;
            for (Key k : row.keys) {
                float w = (k.flex ? fw : k.weight * sc) * u;
                k.cell.set(x, y, x + w, y + rh);
                float vg = row.h < 1f ? vgap * 0.5f : vgap;
                k.draw.set(x + hgap / 2, y + vg / 2, x + w - hgap / 2, y + rh - vg / 2);
                x += w;
            }
            row.top = y;
            row.bottom = y + rh;
            y += rh;
        }
    }

    private Key hit(float x, float y) {
        if (layout == null || layout.rows.isEmpty()) return null;
        KeyboardLayout.Row best = layout.rows.get(layout.rows.size() - 1);
        for (KeyboardLayout.Row r : layout.rows) {
            if (y < r.bottom) {
                best = r;
                break;
            }
        }
        Key bk = null;
        float bd = Float.MAX_VALUE;
        for (Key k : best.keys) {
            if (k.type == Key.T.SPACER) continue;
            if (x >= k.cell.left && x < k.cell.right) return k;
            float d = Math.min(Math.abs(x - k.cell.left), Math.abs(x - k.cell.right));
            if (d < bd) {
                bd = d;
                bk = k;
            }
        }
        return bk;
    }

    // ------------------------------------------------------------------ drawing

    @Override
    protected void onDraw(Canvas c) {
        if (glass) {
            if (drawPanel) drawGlassPanel(c);
            drawGlassRim(c);
        } else {
            c.drawColor(theme.bg);
        }
        if (layout == null) return;
        if (showSuggest) drawSuggest(c);
        if (style == BB) drawFrets(c);
        for (KeyboardLayout.Row row : layout.rows) {
            for (Key k : row.keys) {
                if (k.type == Key.T.SPACER) continue;
                boolean pressed = k == cur && !previewOnly;
                if (style == IOS) drawIos(c, k, pressed);
                else drawBb(c, k, pressed);
            }
        }
    }

    private void drawText(Canvas c, String s, float cx, float cy, float size, int color, Typeface tf, float maxW) {
        if (s == null || s.isEmpty()) return;
        text.setTypeface(tf);
        text.setTextSize(size);
        if (maxW > 0) {
            float w = text.measureText(s);
            if (w > maxW) text.setTextSize(size * maxW / w);
        }
        text.setColor(color);
        Paint.FontMetrics fm = text.getFontMetrics();
        c.drawText(s, cx, cy - (fm.ascent + fm.descent) / 2, text);
    }

    private void drawSuggest(Canvas c) {
        float w = contentW > 0 ? contentW : getWidth();
        float h = suggestH;
        c.save();
        c.translate(contentLeft, 0);
        if (style == IOS) {
            float cw = w / 3f;
            for (int i = 0; i < 3; i++) {
                String s = suggestions.length > i ? suggestions[i] : null;
                if (s == null) continue;
                if (suggestDown && suggestIdx == i) {
                    fill.setColor(glass ? KbTheme.withAlpha(theme.key, 150) : theme.special);
                    float rr = glass ? (h - dp * 6) / 2 : radius;
                    c.drawRoundRect(cw * i + dp * 4, dp * 4, cw * (i + 1) - dp * 4, h - dp * 2, rr, rr, fill);
                }
                drawText(c, s, cw * i + cw / 2, h / 2 + dp, dp * 16.5f * Math.min(scale, 1.15f), theme.text,
                        regular, cw - dp * 12);
            }
            fill.setColor(glass ? KbTheme.withAlpha(theme.text, 40) : KbTheme.withAlpha(theme.special, 255));
            for (int i = 1; i < 3; i++) {
                String a = suggestions.length > i - 1 ? suggestions[i - 1] : null;
                String b = suggestions.length > i ? suggestions[i] : null;
                if (a != null && b != null && !glass)
                    c.drawRect(cw * i - dp * 0.5f, h * 0.28f, cw * i + dp * 0.5f, h * 0.78f, fill);
            }
        } else {
            fill.setColor(0xFF000000);
            fill.setShader(new LinearGradient(0, 0, 0, h, KbTheme.lighten(theme.special, 0.08f),
                    KbTheme.darken(theme.special, 0.2f), Shader.TileMode.CLAMP));
            c.drawRect(-contentLeft, 0, getWidth(), h, fill);
            fill.setShader(null);
            float cw = w / 3f;
            for (int i = 0; i < 3; i++) {
                String s = suggestions.length > i ? suggestions[i] : null;
                if (s == null) continue;
                boolean hl = (suggestDown && suggestIdx == i);
                if (hl || i == 0) {
                    fill.setColor(hl ? theme.accent : KbTheme.withAlpha(theme.accent, 70));
                    c.drawRoundRect(cw * i + dp * 4, dp * 5, cw * (i + 1) - dp * 4, h - dp * 5, dp * 4, dp * 4, fill);
                }
                drawText(c, s, cw * i + cw / 2, h / 2, dp * 15 * Math.min(scale, 1.15f),
                        hl ? KbTheme.contrast(theme.accent) : theme.text, i == 0 ? bold : regular, cw - dp * 14);
            }
        }
        c.restore();
    }

    // ------------------------------------------------------------------ Liquid Glass

    private static float lerp(float a, float b, float t) {
        return a + (b - a) * t;
    }

    private float effT() {
        return blurAvailable ? glassT : glassT * 0.45f;
    }

    /** Alpha of the frosted panel tint. */
    public static int panelAlpha(float t, boolean blur) {
        return (int) (255 * (blur ? lerp(0.9f, 0.32f, t) : lerp(0.97f, 0.8f, t)));
    }

    private final Path panelPath = new Path();

    private void panelPath() {
        float R = dp * 26;
        panelPath.reset();
        panelPath.addRoundRect(new RectF(0, 0, getWidth(), getHeight() + R), new float[]{R, R, R, R, 0, 0, 0, 0},
                Path.Direction.CW);
    }

    private void drawGlassPanel(Canvas c) {
        panelPath();
        int a = panelAlpha(glassT, blurAvailable);
        fill.setColor(0xFF000000);
        fill.setShader(new LinearGradient(0, 0, 0, getHeight(), KbTheme.withAlpha(KbTheme.lighten(theme.bg, 0.12f), a),
                KbTheme.withAlpha(theme.bg, a), Shader.TileMode.CLAMP));
        c.drawPath(panelPath, fill);
        fill.setShader(null);
    }

    private void drawGlassRim(Canvas c) {
        panelPath();
        boolean light = KbTheme.luminance(theme.bg) > 0.5f;
        // soft sheen across the top of the glass sheet
        fill.setColor(0xFF000000);
        fill.setShader(new LinearGradient(0, 0, 0, dp * 30, light ? 0x55FFFFFF : 0x22FFFFFF, 0x00FFFFFF,
                Shader.TileMode.CLAMP));
        c.save();
        c.clipPath(panelPath);
        c.drawRect(0, 0, getWidth(), dp * 30, fill);
        c.restore();
        fill.setShader(null);
        // specular edge
        rim.setStyle(Paint.Style.STROKE);
        rim.setStrokeWidth(dp);
        rim.setColor(0xFF000000);
        rim.setShader(new LinearGradient(0, 0, getWidth(), 0,
                new int[]{0xCCFFFFFF, light ? 0x88FFFFFF : 0x40FFFFFF, 0xCCFFFFFF}, null, Shader.TileMode.CLAMP));
        c.save();
        c.translate(0, dp * 0.5f);
        c.drawPath(panelPath, rim);
        c.restore();
        rim.setShader(null);
    }

    /** A translucent, refractive glass key with specular rim light. */
    private void drawGlassKey(Canvas c, RectF r, int base, boolean pressed, boolean action) {
        float gr = Math.min(r.height() * 0.3f, dp * 13);
        boolean darkKey = KbTheme.luminance(base) < 0.5f;
        float t = effT();
        float alpha = action ? 0.92f : (darkKey ? lerp(0.85f, 0.32f, t) : lerp(0.96f, 0.5f, t));
        if (pressed && !action) alpha = Math.min(1f, alpha + 0.3f);
        int a = (int) (255 * alpha);
        if (shadows) {
            fill.setShader(null);
            fill.setColor(KbTheme.withAlpha(0xFF000000, darkKey ? 55 : 22));
            c.drawRoundRect(r.left, r.top + dp * 1.2f, r.right, r.bottom + dp * 1.8f, gr, gr, fill);
        }
        int body = pressed && !action ? KbTheme.lighten(base, darkKey ? 0.3f : 0f) : base;
        if (pressed && action) body = KbTheme.darken(base, 0.15f);
        fill.setColor(0xFF000000);
        fill.setShader(new LinearGradient(0, r.top, 0, r.bottom,
                KbTheme.withAlpha(KbTheme.lighten(body, darkKey ? 0.16f : 0.5f), a), KbTheme.withAlpha(body, a),
                Shader.TileMode.CLAMP));
        c.drawRoundRect(r, gr, gr, fill);
        // lensing: light gathers at the lower edge of the glass
        fill.setShader(new LinearGradient(0, r.centerY(), 0, r.bottom, 0x00FFFFFF,
                darkKey ? 0x26FFFFFF : 0x66FFFFFF, Shader.TileMode.CLAMP));
        c.drawRoundRect(r, gr, gr, fill);
        fill.setShader(null);
        // specular rim (bright top-left & bottom-right)
        rim.setStyle(Paint.Style.STROKE);
        rim.setStrokeWidth(dp * 1.1f);
        rim.setColor(0xFF000000);
        rim.setShader(new LinearGradient(r.left, r.top, r.right, r.bottom,
                darkKey ? new int[]{0xA0FFFFFF, 0x26FFFFFF, 0x10FFFFFF, 0x70FFFFFF}
                        : new int[]{0xF0FFFFFF, 0x55FFFFFF, 0x33FFFFFF, 0xC0FFFFFF},
                new float[]{0f, 0.35f, 0.65f, 1f}, Shader.TileMode.CLAMP));
        float h = dp * 0.55f;
        c.drawRoundRect(r.left + h, r.top + h, r.right - h, r.bottom - h, gr, gr, rim);
        rim.setShader(null);
    }

    private void drawFrets(Canvas c) {
        float fh = Math.max(dp * 3f, vgap * 0.45f);
        int lt = KbTheme.lighten(theme.fret, 0.6f), mid = theme.fret, dk = KbTheme.darken(theme.fret, 0.35f);
        fill.setColor(0xFF000000);
        for (int i = 0; i < layout.rows.size(); i++) {
            float y = layout.rows.get(i).top;
            if (i == 0 && !showSuggest) continue;
            float t = y - fh / 2, b = y + fh / 2;
            fill.setShader(new LinearGradient(0, t, 0, b, new int[]{lt, mid, dk}, new float[]{0f, 0.45f, 1f},
                    Shader.TileMode.CLAMP));
            c.drawRect(0, t, getWidth(), b, fill);
        }
        fill.setShader(null);
    }

    private void iconPaint(int color) {
        icon.setColor(color);
        icon.setShader(null);
    }

    private void drawIos(Canvas c, Key k, boolean pressed) {
        RectF r = k.draw;
        float cx = r.centerX(), cy = r.centerY();
        float sw = dp * 1.6f;
        if (k.bare) {
            if (pressed) {
                fill.setColor(glass ? KbTheme.withAlpha(theme.key, 140) : theme.special);
                if (layout.emoji && k.isChar()) c.drawRoundRect(r, radius * 2, radius * 2, fill);
                else c.drawCircle(cx, cy, Math.min(r.width(), r.height()) * 0.55f, fill);
            }
            if (k.isChar()) {
                drawText(c, k.label, cx, cy, rowH * 0.55f, theme.text, regular, 0);
                return;
            }
            int ic = glass ? KbTheme.withAlpha(theme.text, 200) : KbTheme.blend(theme.text, theme.bg, 0.35f);
            iconPaint(ic);
            float s = rowH * 0.44f;
            if (k.type == Key.T.GLOBE) Icons.globe(c, cx, cy, s, icon, sw);
            else if (k.type == Key.T.MIC) Icons.mic(c, cx, cy, s * 1.05f, icon, sw);
            return;
        }
        boolean fn = k.functional();
        boolean action = k.type == Key.T.ENTER && enterAction;
        int col = fn ? theme.special : theme.key;
        if (action) col = theme.accent;
        if (k.type == Key.T.SHIFT && (shifted || capsLock)) col = theme.key;
        if (pressed) {
            if (action) col = KbTheme.darken(theme.accent, 0.2f);
            else if (fn) col = theme.key;
            else if (!(showPreview && k.isChar())) col = theme.special;
        }
        if (glass) {
            int gb = fn ? theme.special : theme.key;
            if (action) gb = theme.accent;
            if (k.type == Key.T.SHIFT && (shifted || capsLock)) gb = KbTheme.luminance(theme.key) < 0.5f
                    ? KbTheme.lighten(theme.key, 0.7f) : theme.key;
            drawGlassKey(c, r, gb, pressed && !(showPreview && k.isChar()), action);
        } else {
            if (shadows) {
                fill.setColor(theme.shadow);
                c.drawRoundRect(r.left, r.top + dp, r.right, r.bottom + dp, radius, radius, fill);
            }
            fill.setColor(col);
            c.drawRoundRect(r, radius, radius, fill);
        }

        int tc = action ? KbTheme.contrast(theme.accent) : theme.text;
        float maxW = r.width() - dp * 6;
        switch (k.type) {
            case CHAR: {
                String s = label(k);
                if (layout.flick && k.alt != null) {
                    drawText(c, k.alt, cx, r.top + r.height() * 0.28f, rowH * 0.22f, KbTheme.withAlpha(tc, 130),
                            regular, maxW);
                    drawText(c, k.shiftText != null ? k.label : s, cx, r.top + r.height() * 0.64f, rowH * 0.36f,
                            tc, regular, maxW);
                    break;
                }
                boolean single = s.codePointCount(0, s.length()) == 1;
                float size = rowH * (single ? (layout.letters ? 0.46f : 0.42f) : 0.32f);
                drawText(c, s, cx, cy - (layout.letters && k.caseable && !(shifted || capsLock) ? dp * 2 : dp),
                        size, tc, regular, maxW);
                break;
            }
            case SHIFT:
                iconPaint(tc);
                Icons.shift(c, cx, cy, rowH * 0.38f, icon, shifted || capsLock, capsLock, sw);
                break;
            case DELETE:
                iconPaint(tc);
                Icons.delete(c, cx, cy, rowH * 0.34f, icon, sw, pressed, glass ? theme.special : col);
                break;
            case EMOJI:
                iconPaint(tc);
                Icons.smiley(c, cx, cy, rowH * 0.42f, icon, sw);
                break;
            case GLOBE:
                iconPaint(tc);
                Icons.globe(c, cx, cy, rowH * 0.42f, icon, sw);
                break;
            case MIC:
                iconPaint(tc);
                Icons.mic(c, cx, cy, rowH * 0.42f, icon, sw);
                break;
            case HIDE:
                iconPaint(tc);
                Icons.hide(c, cx, cy, rowH * 0.42f, icon, sw);
                break;
            case SPACE:
                drawText(c, spaceLabel, cx, cy, rowH * 0.30f, tc, regular, maxW);
                break;
            default:
                drawText(c, k.label, cx, cy, rowH * 0.30f, tc, regular, maxW);
                break;
        }
    }

    private String label(Key k) {
        String s = k.label;
        if (k.caseable) s = (shifted || capsLock) ? s.toUpperCase(locale) : s.toLowerCase(locale);
        return s;
    }

    private void drawBb(Canvas c, Key k, boolean pressed) {
        RectF r = k.draw;
        float cx = r.centerX(), cy = r.centerY();
        float sw = dp * 1.8f;
        boolean fn = k.functional();
        int base = fn ? theme.special : theme.key;
        if ((k.type == Key.T.ALT && altOn) || (k.type == Key.T.SHIFT && (shifted || capsLock)))
            base = KbTheme.blend(base, theme.accent, 0.55f);
        if (pressed) base = KbTheme.blend(base, theme.accent, 0.45f);

        if (shadows) {
            fill.setColor(0x80000000);
            c.drawRoundRect(r.left, r.top + dp * 1.5f, r.right, r.bottom + dp * 1.5f, radius, radius, fill);
        }
        fill.setColor(0xFF000000);
        fill.setShader(new LinearGradient(0, r.top, 0, r.bottom, KbTheme.lighten(base, 0.18f),
                KbTheme.darken(base, 0.25f), Shader.TileMode.CLAMP));
        c.drawRoundRect(r, radius, radius, fill);
        fill.setShader(null);
        // glossy top highlight (sculpted keycap)
        fill.setColor(0xFF000000);
        fill.setShader(new LinearGradient(0, r.top, 0, r.top + r.height() * 0.55f, 0x2EFFFFFF, 0x00FFFFFF,
                Shader.TileMode.CLAMP));
        c.drawRoundRect(r.left + dp, r.top + dp, r.right - dp, r.top + r.height() * 0.55f, radius, radius, fill);
        fill.setShader(null);
        fill.setColor(KbTheme.withAlpha(KbTheme.lighten(base, 0.4f), 110));
        c.drawRect(r.left + radius, r.top + dp * 0.5f, r.right - radius, r.top + dp * 1.3f, fill);

        int tc = theme.text;
        float maxW = r.width() - dp * 4;
        switch (k.type) {
            case CHAR: {
                if (layout.emoji) {
                    drawText(c, k.label, cx, cy, rowH * 0.48f, tc, regular, 0);
                    break;
                }
                String up = k.caseable ? k.label.toUpperCase(locale) : k.label;
                if (k.alt != null && showAltLabels && layout.letters) {
                    int altCol = altOn ? KbTheme.lighten(theme.accent, 0.25f) : theme.alt;
                    drawText(c, k.alt, cx, r.top + r.height() * 0.28f, rowH * (altOn ? 0.30f : 0.24f), altCol,
                            bold, maxW);
                    int lc = altOn ? KbTheme.withAlpha(tc, 120) : tc;
                    drawText(c, up, cx, r.top + r.height() * 0.66f, rowH * 0.36f, lc, bold, maxW);
                } else {
                    drawText(c, up, cx, cy, rowH * 0.40f, tc, bold, maxW);
                }
                break;
            }
            case ALT:
                drawText(c, "alt", cx, cy, rowH * 0.30f, tc, bold, maxW);
                if (altLock) {
                    fill.setColor(theme.accent);
                    c.drawRoundRect(cx - dp * 8, r.bottom - dp * 6, cx + dp * 8, r.bottom - dp * 4, dp, dp, fill);
                }
                break;
            case SHIFT:
                iconPaint(tc);
                Icons.shift(c, cx, cy, rowH * 0.34f, icon, shifted || capsLock, capsLock, sw);
                break;
            case DELETE:
                iconPaint(tc);
                Icons.delete(c, cx, cy, rowH * 0.32f, icon, sw, false, base);
                break;
            case ENTER:
                iconPaint(enterAction ? KbTheme.lighten(theme.accent, 0.2f) : tc);
                Icons.enter(c, cx, cy, rowH * 0.34f, icon, sw);
                break;
            case GLOBE:
                iconPaint(tc);
                Icons.globe(c, cx, cy, rowH * 0.38f, icon, sw * 0.9f);
                break;
            case SPACE:
                drawText(c, spaceLabel, cx, cy, rowH * 0.24f, KbTheme.withAlpha(tc, 150), medium, maxW);
                break;
            default:
                drawText(c, k.label, cx, cy, rowH * 0.30f, tc, bold, maxW);
                break;
        }
    }

    // ------------------------------------------------------------------ touch

    private final Runnable longPress = new Runnable() {
        @Override
        public void run() {
            if (cur == null || listener == null) return;
            longFired = true;
            String[] items = listener.alternates(cur);
            if (items != null && items.length > 0) {
                showAlts(cur, items);
            } else if (!listener.onLongPress(cur)) {
                longFired = false;
            } else {
                hidePopup();
            }
        }
    };

    private final Runnable repeat = new Runnable() {
        @Override
        public void run() {
            if (cur == null || cur.type != Key.T.DELETE || listener == null) return;
            repeatCount++;
            listener.onRepeat(cur, repeatCount);
            handler.postDelayed(this, repeatCount > 20 ? 110 : 60);
        }
    };

    @SuppressLint("ClickableViewAccessibility")
    @Override
    public boolean onTouchEvent(MotionEvent e) {
        if (previewOnly) return true;
        switch (e.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                start(e.getPointerId(0), e.getX(), e.getY());
                break;
            case MotionEvent.ACTION_POINTER_DOWN: {
                int i = e.getActionIndex();
                if (!altsMode && !spaceDrag) {
                    finish(true);
                    start(e.getPointerId(i), e.getX(i), e.getY(i));
                }
                break;
            }
            case MotionEvent.ACTION_MOVE: {
                int i = e.findPointerIndex(pointerId);
                if (i >= 0) move(e.getX(i), e.getY(i));
                break;
            }
            case MotionEvent.ACTION_POINTER_UP:
                if (e.getPointerId(e.getActionIndex()) == pointerId) finish(true);
                break;
            case MotionEvent.ACTION_UP:
                if (e.getPointerId(e.getActionIndex()) == pointerId) finish(true);
                break;
            case MotionEvent.ACTION_CANCEL:
                finish(false);
                break;
        }
        return true;
    }

    private boolean longPressable(Key k) {
        return k.type == Key.T.CHAR || k.type == Key.T.GLOBE || k.type == Key.T.SPACE;
    }

    private void start(int pid, float x, float y) {
        pointerId = pid;
        longFired = altsMode = spaceDrag = false;
        repeatCount = 0;
        if (showSuggest && y < suggestH) {
            suggestDown = true;
            float cw = (contentW > 0 ? contentW : getWidth()) / 3f;
            suggestIdx = Math.max(0, Math.min(2, (int) ((x - contentLeft) / cw)));
            cur = null;
            invalidate();
            return;
        }
        Key k = hit(x, y);
        if (k == null) return;
        cur = k;
        downX = x;
        downY = y;
        flick = false;
        lastDragX = x;
        if (listener != null) listener.onPress(k);
        if (k.type == Key.T.DELETE) {
            if (listener != null) listener.onKey(k);
            handler.postDelayed(repeat, 420);
        } else if (longPressable(k)) {
            handler.postDelayed(longPress, k.type == Key.T.SPACE ? 550 : 380);
        }
        if (k.isChar()) showKeyPreview(k);
        invalidate();
    }

    private void move(float x, float y) {
        if (altsMode) {
            int n = altItems.length;
            int s = (int) Math.floor((x - altOriginX) / altCellW);
            s = Math.max(0, Math.min(n - 1, s));
            if (s != altSel) {
                altSel = s;
                pop.sel = s;
                pop.invalidate();
            }
            return;
        }
        if (cur == null) return;
        if (cur.type == Key.T.SPACE) {
            if (!spaceDrag && Math.abs(x - downX) > dp * 14) {
                spaceDrag = true;
                handler.removeCallbacks(longPress);
                lastDragX = x;
            }
            if (spaceDrag && listener != null) {
                float step = dp * 9;
                while (x - lastDragX > step) {
                    listener.onCursorMove(1);
                    lastDragX += step;
                }
                while (lastDragX - x > step) {
                    listener.onCursorMove(-1);
                    lastDragX -= step;
                }
            }
            return;
        }
        if (longFired) return;
        if (layout.flick && cur.isChar() && cur.alt != null) {
            // iPad: swipe down on a key types the small character printed on it
            if (!flick && y - downY > rowH * 0.32f) {
                flick = true;
                handler.removeCallbacks(longPress);
                showKeyPreview(cur);
                invalidate();
            } else if (flick && y - downY < rowH * 0.15f) {
                flick = false;
                showKeyPreview(cur);
            }
            if (flick) return;
        }
        if (cur.isChar()) {
            Key k = hit(x, y);
            if (k != null && k != cur && k.isChar()) {
                cur = k;
                handler.removeCallbacks(longPress);
                handler.postDelayed(longPress, 380);
                showKeyPreview(k);
                invalidate();
            }
        }
    }

    private void finish(boolean commit) {
        handler.removeCallbacks(longPress);
        handler.removeCallbacks(repeat);
        if (suggestDown) {
            suggestDown = false;
            if (commit && listener != null) listener.onSuggestion(suggestIdx);
            invalidate();
            return;
        }
        Key k = cur;
        cur = null;
        pointerId = -1;
        hidePopup();
        if (k == null) return;
        if (altsMode) {
            altsMode = false;
            if (commit && listener != null) listener.onAltSelected(k, altSel);
        } else if (commit && flick && listener != null) {
            listener.onFlick(k);
        } else if (commit && !longFired && !spaceDrag && k.type != Key.T.DELETE && listener != null) {
            listener.onKey(k);
        }
        flick = false;
        invalidate();
    }

    public void cancelTouch() {
        handler.removeCallbacks(longPress);
        handler.removeCallbacks(repeat);
        cur = null;
        suggestDown = false;
        altsMode = false;
        hidePopup();
    }

    // ------------------------------------------------------------------ popups

    private void ensurePopup() {
        if (popup != null) return;
        pop = new PopView(getContext());
        popup = new PopupWindow(pop);
        popup.setClippingEnabled(false);
        popup.setTouchable(false);
        popup.setFocusable(false);
        popup.setBackgroundDrawable(null);
        popup.setAnimationStyle(0);
    }

    private void placePopup(float left, float top, int w, int h) {
        if (getWindowToken() == null) return;
        getLocationInWindow(loc);
        int x = loc[0] + (int) left, y = loc[1] + (int) top;
        if (popup.isShowing()) {
            popup.update(x, y, w, h);
        } else {
            popup.setWidth(w);
            popup.setHeight(h);
            try {
                popup.showAtLocation(this, Gravity.NO_GRAVITY, x, y);
            } catch (RuntimeException ignored) {
                // window not ready
            }
        }
        pop.invalidate();
    }

    private void showKeyPreview(Key k) {
        if (!showPreview || previewOnly || k.bare && !layout.emoji) {
            hidePopup();
            return;
        }
        if (layout.emoji && style == IOS) {
            hidePopup();
            return;
        }
        ensurePopup();
        RectF kr = k.draw;
        float kw = kr.width(), kh = kr.height();
        pop.alts = false;
        pop.label = flick && k.alt != null ? k.alt : k.alt != null && altOn && style == BB ? k.alt : (style == BB && k.caseable
                ? ((shifted || capsLock) ? k.label.toUpperCase(locale) : k.label.toLowerCase(locale)) : label(k));
        if (style == IOS) {
            float ext = Math.max(dp * 8, kw * 0.32f);
            pop.bulbW = kw + 2 * ext;
            pop.bulbH = kh * 1.12f;
            pop.conn = kh * 0.32f;
            pop.stemW = kw;
            pop.stemH = kh;
            float H = pop.bulbH + pop.conn + kh;
            float left = Math.max(0, Math.min(getWidth() - pop.bulbW, kr.left - ext));
            pop.stemX = kr.left - left;
            placePopup(left, kr.bottom - H, (int) Math.ceil(pop.bulbW), (int) Math.ceil(H + dp * 2));
        } else {
            float w = Math.max(kw * 1.55f, dp * 48), h = kh * 1.35f;
            pop.bulbW = w;
            pop.bulbH = h;
            float left = Math.max(0, Math.min(getWidth() - w, kr.centerX() - w / 2));
            placePopup(left, kr.top - h - dp * 8, (int) w, (int) h);
        }
    }

    private void showAlts(Key k, String[] items) {
        if (previewOnly) return;
        ensurePopup();
        altsMode = true;
        altItems = items;
        altSel = 0;
        RectF kr = k.draw;
        float kw = kr.width(), kh = kr.height();
        int n = items.length;
        boolean longText = false;
        for (String s : items) if (s.codePointCount(0, s.length()) > 2) longText = true;
        float cw = Math.max(Math.min(kw, dp * 44), longText ? dp * 56 : dp * 30);
        float pad = dp * 6;
        float bw = n * cw + 2 * pad;
        if (bw > getWidth()) {
            cw = (getWidth() - 2 * pad) / n;
            bw = getWidth();
        }
        pop.alts = true;
        pop.items = items;
        pop.sel = 0;
        pop.cellW = cw;
        pop.pad = pad;
        float left = Math.max(0, Math.min(getWidth() - bw, kr.centerX() - cw / 2 - pad));
        altOriginX = left + pad;
        altCellW = cw;
        // pre-select the cell nearest the finger
        altSel = Math.max(0, Math.min(n - 1, (int) ((kr.centerX() - altOriginX) / cw)));
        pop.sel = altSel;
        if (style == IOS) {
            pop.bulbW = bw;
            pop.bulbH = kh * 1.1f;
            pop.conn = kh * 0.3f;
            pop.stemW = kw;
            pop.stemH = kh;
            pop.stemX = kr.left - left;
            float H = pop.bulbH + pop.conn + kh;
            placePopup(left, kr.bottom - H, (int) Math.ceil(bw), (int) Math.ceil(H + dp * 2));
        } else {
            pop.bulbW = bw;
            pop.bulbH = kh * 1.2f;
            placePopup(left, kr.top - pop.bulbH - dp * 8, (int) Math.ceil(bw), (int) Math.ceil(pop.bulbH));
        }
    }

    private void hidePopup() {
        if (popup != null && popup.isShowing()) {
            try {
                popup.dismiss();
            } catch (RuntimeException ignored) {
            }
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        cancelTouch();
        super.onDetachedFromWindow();
    }

    /** Key preview balloon / alternates strip. */
    private final class PopView extends View {
        boolean alts;
        String label;
        String[] items;
        int sel;
        float stemX, stemW, stemH, bulbW, bulbH, conn, cellW, pad;
        private final Path path = new Path();
        private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        PopView(Context c) {
            super(c);
        }

        @Override
        protected void onDraw(Canvas c) {
            if (style == IOS) drawIosPop(c);
            else drawBbPop(c);
        }

        private void buildBalloon() {
            path.reset();
            float R = dp * 9;
            path.addRoundRect(new RectF(0, 0, bulbW, bulbH), R, R, Path.Direction.CW);
            float stemTop = bulbH + conn;
            path.addRoundRect(new RectF(stemX, stemTop - dp, stemX + stemW, stemTop + stemH), radius, radius,
                    Path.Direction.CW);
            Path q = new Path();
            float y0 = bulbH - R;
            q.moveTo(stemX, stemTop);
            q.cubicTo(stemX, stemTop - conn * 0.55f, 0, bulbH + conn * 0.05f, 0, y0);
            q.lineTo(bulbW, y0);
            q.cubicTo(bulbW, bulbH + conn * 0.05f, stemX + stemW, stemTop - conn * 0.55f, stemX + stemW, stemTop);
            q.close();
            path.op(q, Path.Op.UNION);
        }

        private void drawIosPop(Canvas c) {
            buildBalloon();
            p.setStyle(Paint.Style.FILL);
            if (shadows) {
                p.setColor(KbTheme.withAlpha(theme.shadow, 150));
                c.save();
                c.translate(0, dp);
                c.drawPath(path, p);
                c.restore();
            }
            if (glass) {
                int kc = KbTheme.luminance(theme.key) < 0.5f ? KbTheme.lighten(theme.key, 0.12f) : theme.key;
                p.setColor(KbTheme.withAlpha(kc, 0xF5));
            } else {
                p.setColor(theme.key);
            }
            c.drawPath(path, p);
            if (glass) {
                p.setStyle(Paint.Style.STROKE);
                p.setStrokeWidth(dp);
                p.setColor(0xB3FFFFFF);
                c.drawPath(path, p);
                p.setStyle(Paint.Style.FILL);
            }
            if (!alts) {
                drawPopText(c, label, bulbW / 2, bulbH * 0.55f, rowH * 0.66f, theme.text, regular);
            } else {
                for (int i = 0; i < items.length; i++) {
                    float l = pad + cellW * i;
                    int tc = theme.text;
                    if (i == sel) {
                        p.setColor(theme.accent);
                        c.drawRoundRect(l + dp, dp * 5, l + cellW - dp, bulbH - dp * 5, radius, radius, p);
                        tc = KbTheme.contrast(theme.accent);
                    }
                    drawPopText(c, items[i], l + cellW / 2, bulbH / 2, rowH * 0.44f, tc, regular);
                }
            }
        }

        private void drawBbPop(Canvas c) {
            RectF r = new RectF(dp, dp, bulbW - dp, bulbH - dp);
            p.setStyle(Paint.Style.FILL);
            p.setColor(0xFF000000);
            p.setShader(new LinearGradient(0, 0, 0, bulbH, KbTheme.lighten(theme.key, 0.15f),
                    KbTheme.darken(theme.key, 0.3f), Shader.TileMode.CLAMP));
            c.drawRoundRect(r, dp * 7, dp * 7, p);
            p.setShader(null);
            p.setStyle(Paint.Style.STROKE);
            p.setStrokeWidth(dp * 1.5f);
            p.setColor(theme.accent);
            c.drawRoundRect(r, dp * 7, dp * 7, p);
            p.setStyle(Paint.Style.FILL);
            if (!alts) {
                drawPopText(c, label, bulbW / 2, bulbH / 2, rowH * 0.6f, theme.text, bold);
            } else {
                for (int i = 0; i < items.length; i++) {
                    float l = pad + cellW * i;
                    int tc = theme.text;
                    if (i == sel) {
                        p.setColor(theme.accent);
                        c.drawRoundRect(l + dp, dp * 5, l + cellW - dp, bulbH - dp * 5, dp * 4, dp * 4, p);
                        tc = KbTheme.contrast(theme.accent);
                    }
                    drawPopText(c, items[i], l + cellW / 2, bulbH / 2, rowH * 0.42f, tc, bold);
                }
            }
        }

        private void drawPopText(Canvas c, String s, float cx, float cy, float size, int color, Typeface tf) {
            if (s == null) return;
            p.setTypeface(tf);
            p.setTextAlign(Paint.Align.CENTER);
            p.setTextSize(size);
            float maxW = (alts ? cellW : bulbW) - dp * 4;
            float w = p.measureText(s);
            if (w > maxW) p.setTextSize(size * maxW / w);
            p.setColor(color);
            Paint.FontMetrics fm = p.getFontMetrics();
            c.drawText(s, cx, cy - (fm.ascent + fm.descent) / 2, p);
        }
    }
}
