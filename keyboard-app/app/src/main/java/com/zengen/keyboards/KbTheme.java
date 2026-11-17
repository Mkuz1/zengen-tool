package com.zengen.keyboards;

import android.graphics.Color;

/** Resolved colours for drawing a keyboard. */
public final class KbTheme {
    public final int bg, key, special, text, accent, fret, alt, shadow;

    public KbTheme(int bg, int key, int special, int text, int accent, int fret, int alt) {
        this.bg = bg;
        this.key = key;
        this.special = special;
        this.text = text;
        this.accent = accent;
        this.fret = fret;
        this.alt = alt;
        this.shadow = darken(key, luminance(key) > 0.5f ? 0.42f : 0.55f);
    }

    public static float luminance(int c) {
        return (0.299f * Color.red(c) + 0.587f * Color.green(c) + 0.114f * Color.blue(c)) / 255f;
    }

    public static int contrast(int c) {
        return luminance(c) > 0.62f ? Color.BLACK : Color.WHITE;
    }

    public static int darken(int c, float f) {
        return Color.argb(Color.alpha(c), (int) (Color.red(c) * (1 - f)), (int) (Color.green(c) * (1 - f)),
                (int) (Color.blue(c) * (1 - f)));
    }

    public static int lighten(int c, float f) {
        return Color.argb(Color.alpha(c), (int) (Color.red(c) + (255 - Color.red(c)) * f),
                (int) (Color.green(c) + (255 - Color.green(c)) * f), (int) (Color.blue(c) + (255 - Color.blue(c)) * f));
    }

    public static int blend(int a, int b, float t) {
        return Color.argb(255, (int) (Color.red(a) + (Color.red(b) - Color.red(a)) * t),
                (int) (Color.green(a) + (Color.green(b) - Color.green(a)) * t),
                (int) (Color.blue(a) + (Color.blue(b) - Color.blue(a)) * t));
    }

    public static int withAlpha(int c, int a) {
        return (c & 0x00FFFFFF) | (a << 24);
    }
}
