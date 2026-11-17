package com.zengen.keyboards;

import android.graphics.RectF;

/** A single key on a soft keyboard. */
public final class Key {
    public enum T {
        CHAR, SHIFT, DELETE, SPACE, ENTER, NUM, LETTERS, MORESYM, EMOJI, GLOBE, MIC, ALT, SYM, PREV, NEXT, SPACER
    }

    public final T type;
    /** Text committed when tapped (CHAR keys). */
    public String text;
    /** Label shown on the key (may differ from text). */
    public String label;
    /** BlackBerry "alt" character printed on the key. */
    public String alt;
    /** Long-press alternates (accents etc). */
    public String[] alts;
    public float weight = 1f;
    public boolean flex;
    /** Letter that changes with shift. */
    public boolean caseable;
    /** Drawn without a key cap (iOS globe / mic bar, emoji grid). */
    public boolean bare;

    public final RectF cell = new RectF();
    public final RectF draw = new RectF();

    public Key(T type) {
        this.type = type;
    }

    public boolean isChar() {
        return type == T.CHAR;
    }

    /** Function keys use the darker "special" colour. */
    public boolean functional() {
        switch (type) {
            case CHAR:
            case SPACE:
            case SPACER:
                return false;
            default:
                return true;
        }
    }
}
