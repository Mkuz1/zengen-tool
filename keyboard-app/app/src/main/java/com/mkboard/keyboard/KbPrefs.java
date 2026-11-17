package com.mkboard.keyboard;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Per-keyboard settings. Each keyboard has its own independent preferences file. */
public final class KbPrefs {
    public static final String IOS = "ios", BB = "bb";

    public static final String K_LANGS = "langs", K_CUR = "cur_lang", K_PRESET = "preset",
            K_BG = "c_bg", K_KEY = "c_key", K_SPECIAL = "c_special", K_TEXT = "c_text", K_ACCENT = "c_accent",
            K_FRET = "c_fret", K_ALT = "c_alt", K_HEIGHT = "height",
            K_AUTOCAP = "autocap", K_CAPSLOCK = "capslock", K_DOUBLESPACE = "dblspace", K_PREVIEW = "preview",
            K_PREDICT = "predict", K_SOUND = "sound", K_VIBRATE = "vibrate", K_SHOWALT = "showalt",
            K_SHADOW = "shadow", K_SPACE_CURSOR = "space_cursor", K_SYM_RETURN = "sym_return",
            K_GLASS = "glass", K_GLASS_T = "glass_t", K_WIDE = "wide";

    public final String kind;
    public final SharedPreferences sp;

    public KbPrefs(Context c, String kind) {
        this.kind = kind;
        this.sp = c.getSharedPreferences(kind + "_prefs", Context.MODE_PRIVATE);
    }

    public boolean isIos() {
        return IOS.equals(kind);
    }

    private static String defaultLang() {
        String l = Locale.getDefault().getLanguage();
        if (Languages.supported(l) && !"en".equals(l)) return "en," + l;
        return "en";
    }

    public List<String> langs() {
        String s = sp.getString(K_LANGS, defaultLang());
        List<String> out = new ArrayList<>();
        for (String p : s.split(",")) {
            p = p.trim();
            if (Languages.supported(p) && !out.contains(p)) out.add(p);
        }
        if (out.isEmpty()) out.add("en");
        return out;
    }

    public void setLangs(List<String> l) {
        sp.edit().putString(K_LANGS, String.join(",", l)).apply();
    }

    public String curLang() {
        List<String> l = langs();
        String c = sp.getString(K_CUR, null);
        return c != null && l.contains(c) ? c : l.get(0);
    }

    public void setCurLang(String c) {
        sp.edit().putString(K_CUR, c).apply();
    }

    public boolean b(String k) {
        return sp.getBoolean(k, defBool(k));
    }

    private boolean defBool(String k) {
        switch (k) {
            case K_VIBRATE:
                return !isIos();
            case K_WIDE:
                return isIos();
            default:
                return true;
        }
    }

    public Presets.Preset preset() {
        Presets.Preset[] all = Presets.forKind(kind);
        String n = sp.getString(K_PRESET, all[0].name);
        for (Presets.Preset p : all) if (p.name.equals(n)) return p;
        return all[0];
    }

    public int color(String k) {
        Presets.Preset p = preset();
        int def;
        switch (k) {
            case K_BG: def = p.bg; break;
            case K_KEY: def = p.key; break;
            case K_SPECIAL: def = p.special; break;
            case K_TEXT: def = p.text; break;
            case K_ACCENT: def = p.accent; break;
            case K_FRET: def = p.fret; break;
            default: def = p.alt; break;
        }
        return sp.getInt(k, def);
    }

    public void setColor(String k, int c) {
        sp.edit().putInt(k, c).apply();
    }

    public void applyPreset(Presets.Preset p) {
        sp.edit().putString(K_PRESET, p.name)
                .remove(K_BG).remove(K_KEY).remove(K_SPECIAL).remove(K_TEXT)
                .remove(K_ACCENT).remove(K_FRET).remove(K_ALT).apply();
    }

    public KbTheme theme() {
        return new KbTheme(color(K_BG), color(K_KEY), color(K_SPECIAL), color(K_TEXT), color(K_ACCENT),
                color(K_FRET), color(K_ALT));
    }

    /** Liquid Glass transparency 0 (frosted) – 1 (clear). */
    public float glassT() {
        return sp.getInt(K_GLASS_T, 55) / 100f;
    }

    /** Height scale 0.8 – 1.3. */
    public float height() {
        return sp.getInt(K_HEIGHT, 100) / 100f;
    }

    public void resetAll() {
        String langs = sp.getString(K_LANGS, null);
        SharedPreferences.Editor e = sp.edit().clear();
        if (langs != null) e.putString(K_LANGS, langs);
        e.apply();
    }
}
