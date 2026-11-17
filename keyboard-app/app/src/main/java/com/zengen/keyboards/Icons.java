package com.zengen.keyboards;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;

/** Hand-drawn vector glyphs for function keys. */
final class Icons {
    private static final Path P = new Path();
    private static final RectF R = new RectF();

    private static void stroke(Paint p, float w) {
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(w);
        p.setStrokeJoin(Paint.Join.ROUND);
        p.setStrokeCap(Paint.Cap.ROUND);
    }

    static void shift(Canvas c, float cx, float cy, float s, Paint p, boolean filled, boolean lock, float sw) {
        P.reset();
        float top = cy - s * 0.52f;
        P.moveTo(cx, top);
        P.lineTo(cx + s * 0.5f, cy + s * 0.02f);
        P.lineTo(cx + s * 0.22f, cy + s * 0.02f);
        P.lineTo(cx + s * 0.22f, cy + s * 0.36f);
        P.lineTo(cx - s * 0.22f, cy + s * 0.36f);
        P.lineTo(cx - s * 0.22f, cy + s * 0.02f);
        P.lineTo(cx - s * 0.5f, cy + s * 0.02f);
        P.close();
        stroke(p, sw);
        if (filled) p.setStyle(Paint.Style.FILL_AND_STROKE);
        c.drawPath(P, p);
        if (lock) {
            p.setStyle(Paint.Style.FILL);
            c.drawRect(cx - s * 0.24f, cy + s * 0.5f, cx + s * 0.24f, cy + s * 0.5f + sw * 1.4f, p);
        }
    }

    static void delete(Canvas c, float cx, float cy, float s, Paint p, float sw, boolean filled, int bgColor) {
        float w = s * 1.3f, h = s * 0.86f;
        float l = cx - w / 2, r = cx + w / 2;
        P.reset();
        P.moveTo(l, cy);
        P.lineTo(l + h * 0.5f, cy - h / 2);
        P.lineTo(r, cy - h / 2);
        P.lineTo(r, cy + h / 2);
        P.lineTo(l + h * 0.5f, cy + h / 2);
        P.close();
        stroke(p, sw);
        if (filled) p.setStyle(Paint.Style.FILL_AND_STROKE);
        c.drawPath(P, p);
        float xc = cx + h * 0.22f, x = h * 0.2f;
        int col = p.getColor();
        stroke(p, sw);
        if (filled) p.setColor(bgColor);
        c.drawLine(xc - x, cy - x, xc + x, cy + x, p);
        c.drawLine(xc - x, cy + x, xc + x, cy - x, p);
        p.setColor(col);
    }

    static void globe(Canvas c, float cx, float cy, float s, Paint p, float sw) {
        float r = s / 2;
        stroke(p, sw);
        c.drawCircle(cx, cy, r, p);
        R.set(cx - r * 0.45f, cy - r, cx + r * 0.45f, cy + r);
        c.drawOval(R, p);
        c.drawLine(cx - r, cy, cx + r, cy, p);
        float hc = r * 0.866f;
        c.drawLine(cx - hc, cy - r * 0.5f, cx + hc, cy - r * 0.5f, p);
        c.drawLine(cx - hc, cy + r * 0.5f, cx + hc, cy + r * 0.5f, p);
    }

    static void smiley(Canvas c, float cx, float cy, float s, Paint p, float sw) {
        float r = s / 2;
        stroke(p, sw);
        c.drawCircle(cx, cy, r, p);
        p.setStyle(Paint.Style.FILL);
        c.drawCircle(cx - r * 0.33f, cy - r * 0.22f, sw * 0.95f, p);
        c.drawCircle(cx + r * 0.33f, cy - r * 0.22f, sw * 0.95f, p);
        stroke(p, sw);
        R.set(cx - r * 0.5f, cy - r * 0.35f, cx + r * 0.5f, cy + r * 0.52f);
        c.drawArc(R, 25, 130, false, p);
    }

    static void mic(Canvas c, float cx, float cy, float s, Paint p, float sw) {
        float w = s * 0.34f, h = s * 0.58f;
        stroke(p, sw);
        R.set(cx - w / 2, cy - s / 2, cx + w / 2, cy - s / 2 + h);
        c.drawRoundRect(R, w / 2, w / 2, p);
        R.set(cx - s * 0.33f, cy - s * 0.32f, cx + s * 0.33f, cy + s * 0.22f);
        c.drawArc(R, 0, 180, false, p);
        c.drawLine(cx, cy + s * 0.22f, cx, cy + s * 0.44f, p);
        c.drawLine(cx - s * 0.18f, cy + s * 0.46f, cx + s * 0.18f, cy + s * 0.46f, p);
    }

    static void enter(Canvas c, float cx, float cy, float s, Paint p, float sw) {
        float w = s * 1.1f, h = s * 0.8f, a = s * 0.22f;
        stroke(p, sw);
        P.reset();
        P.moveTo(cx + w / 2, cy - h / 2);
        P.lineTo(cx + w / 2, cy + h * 0.15f);
        P.lineTo(cx - w / 2, cy + h * 0.15f);
        P.moveTo(cx - w / 2 + a, cy + h * 0.15f - a);
        P.lineTo(cx - w / 2, cy + h * 0.15f);
        P.lineTo(cx - w / 2 + a, cy + h * 0.15f + a);
        c.drawPath(P, p);
    }

    private Icons() {
    }
}
