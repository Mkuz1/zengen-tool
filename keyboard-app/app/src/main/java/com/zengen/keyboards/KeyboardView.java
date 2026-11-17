package com.zengen.keyboards;

import android.annotation.SuppressLint;
import android.content.Context;
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

    private void metrics() {
        if (style == IOS) {
            rowH = dp * 54 * scale;
            vgap = dp * 11 * scale;
            hgap = dp * 6;
            side = dp * 3;
            topPad = dp * 6 * scale;
            bottomPad = dp * 2;
            suggestH = showSuggest ? dp * 42 * scale : dp * 4;
            radius = dp * 5.5f;
        } else {
            rowH = dp * 50 * scale;
            vgap = dp * 8 * scale;
            hgap = dp * 5;
            side = dp * 4;
            topPad = dp * 4;
            bottomPad = dp * 4;
            suggestH = showSuggest ? dp * 38 * scale : 0;
            radius = dp * 5;
        }
    }

    private int desiredHeight() {
        metrics();
        float rows = 0;
        if (layout != null) for (KeyboardLayout.Row r : layout.rows) rows += r.h;
        else rows = 4;
        return (int) (suggestH + topPad + rows * rowH + bottomPad);
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
        float u = (W - 2 * side) / cols;
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
            float x = side + (cols - total) / 2f * u;
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
        c.drawColor(theme.bg);
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
        float w = getWidth();
        float h = suggestH;
        if (style == IOS) {
            float cw = w / 3f;
            for (int i = 0; i < 3; i++) {
                String s = suggestions.length > i ? suggestions[i] : null;
                if (s == null) continue;
                if (suggestDown && suggestIdx == i) {
                    fill.setColor(theme.special);
                    c.drawRoundRect(cw * i + dp * 4, dp * 4, cw * (i + 1) - dp * 4, h - dp * 2, radius, radius, fill);
                }
                drawText(c, s, cw * i + cw / 2, h / 2 + dp, dp * 16.5f * Math.min(scale, 1.15f), theme.text,
                        regular, cw - dp * 12);
            }
            fill.setColor(KbTheme.withAlpha(theme.special, 255));
            for (int i = 1; i < 3; i++) {
                String a = suggestions.length > i - 1 ? suggestions[i - 1] : null;
                String b = suggestions.length > i ? suggestions[i] : null;
                if (a != null && b != null)
                    c.drawRect(cw * i - dp * 0.5f, h * 0.28f, cw * i + dp * 0.5f, h * 0.78f, fill);
            }
        } else {
            fill.setColor(0xFF000000);
            fill.setShader(new LinearGradient(0, 0, 0, h, KbTheme.lighten(theme.special, 0.08f),
                    KbTheme.darken(theme.special, 0.2f), Shader.TileMode.CLAMP));
            c.drawRect(0, 0, w, h, fill);
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
                fill.setColor(theme.special);
                if (layout.emoji && k.isChar()) c.drawRoundRect(r, radius, radius, fill);
                else c.drawCircle(cx, cy, Math.min(r.width(), r.height()) * 0.55f, fill);
            }
            if (k.isChar()) {
                drawText(c, k.label, cx, cy, rowH * 0.55f, theme.text, regular, 0);
                return;
            }
            int ic = KbTheme.blend(theme.text, theme.bg, 0.35f);
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
        if (shadows) {
            fill.setColor(theme.shadow);
            c.drawRoundRect(r.left, r.top + dp, r.right, r.bottom + dp, radius, radius, fill);
        }
        fill.setColor(col);
        c.drawRoundRect(r, radius, radius, fill);

        int tc = action ? KbTheme.contrast(theme.accent) : theme.text;
        float maxW = r.width() - dp * 6;
        switch (k.type) {
            case CHAR: {
                String s = label(k);
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
                Icons.delete(c, cx, cy, rowH * 0.34f, icon, sw, pressed, col);
                break;
            case EMOJI:
                iconPaint(tc);
                Icons.smiley(c, cx, cy, rowH * 0.42f, icon, sw);
                break;
            case GLOBE:
                iconPaint(tc);
                Icons.globe(c, cx, cy, rowH * 0.42f, icon, sw);
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
            suggestIdx = Math.max(0, Math.min(2, (int) (x / (getWidth() / 3f))));
            cur = null;
            invalidate();
            return;
        }
        Key k = hit(x, y);
        if (k == null) return;
        cur = k;
        downX = x;
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
        } else if (commit && !longFired && !spaceDrag && k.type != Key.T.DELETE && listener != null) {
            listener.onKey(k);
        }
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
        pop.label = k.alt != null && altOn && style == BB ? k.alt : (style == BB && k.caseable
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
            p.setColor(theme.key);
            c.drawPath(path, p);
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
