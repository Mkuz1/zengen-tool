package com.zengen.keyboards;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** Supported typing languages and their letter layouts. */
public final class Languages {

    public static final class Lang {
        public final String code, name, nativeName, shortLabel, space, ret, abc;
        public final String[][] rows;
        public final boolean hasCase;
        public final Locale locale;

        Lang(String code, String name, String nativeName, String shortLabel, String space, String ret,
             String abc, boolean hasCase, String r1, String r2, String r3) {
            this.code = code;
            this.name = name;
            this.nativeName = nativeName;
            this.shortLabel = shortLabel;
            this.space = space;
            this.ret = ret;
            this.abc = abc;
            this.hasCase = hasCase;
            this.rows = new String[][]{split(r1), split(r2), split(r3)};
            this.locale = new Locale(code);
        }
    }

    public static final Lang[] ALL = {
            new Lang("en", "English", "English", "EN", "space", "return", "ABC", true,
                    "qwertyuiop", "asdfghjkl", "zxcvbnm"),
            new Lang("ar", "Arabic", "العربية", "ع", "مسافة", "إدخال", "أبج", false,
                    "ضصثقفغعهخحج", "شسيبلاتنمكط", "ذءؤرىةوزظد"),
            new Lang("es", "Spanish", "Español", "ES", "espacio", "intro", "ABC", true,
                    "qwertyuiop", "asdfghjklñ", "zxcvbnm"),
            new Lang("fr", "French", "Français", "FR", "espace", "retour", "ABC", true,
                    "azertyuiop", "qsdfghjklm", "wxcvbn'"),
            new Lang("de", "German", "Deutsch", "DE", "Leerzeichen", "Return", "ABC", true,
                    "qwertzuiopü", "asdfghjklöä", "yxcvbnm"),
            new Lang("it", "Italian", "Italiano", "IT", "spazio", "invio", "ABC", true,
                    "qwertyuiop", "asdfghjkl", "zxcvbnm"),
            new Lang("pt", "Portuguese", "Português", "PT", "espaço", "retorno", "ABC", true,
                    "qwertyuiop", "asdfghjklç", "zxcvbnm"),
            new Lang("ru", "Russian", "Русский", "RU", "Пробел", "Ввод", "АБВ", true,
                    "йцукенгшщзх", "фывапролджэ", "ячсмитьбю"),
            new Lang("tr", "Turkish", "Türkçe", "TR", "boşluk", "giriş", "ABC", true,
                    "qwertyuıopğü", "asdfghjklşi", "zxcvbnmöç"),
    };

    private static final Map<String, String> ACCENTS = new HashMap<>();

    static {
        String[] latin = {
                "a", "àáâäæãåā", "c", "çćč", "e", "èéêëēėę", "i", "îïíīįì", "n", "ñń",
                "o", "ôöòóœøōõ", "s", "ßśš", "u", "ûüùúū", "y", "ÿ", "z", "žźż", "l", "ł",
                "g", "ğ", "ı", "i", "ş", "s",
                // Arabic
                "ا", "أإآء", "ي", "ئى", "و", "ؤ", "ه", "ة", "ء", "ئؤأ", "ك", "گ", "ف", "ڤ", "ج", "چ", "ب", "پ",
                // Cyrillic
                "е", "ё", "ь", "ъ",
                // numbers & symbols
                "0", "°", "1", "¹½⅓¼⅛", "2", "²⅔", "3", "³¾⅜", "4", "⁴", "-", "–—•", "/", "\\",
                "$", "€£¥₹₩¢₽", "&", "§", "\"", "„“”«»", ".", "…", "?", "¿", "!", "¡", "'", "‘’`",
                "%", "‰"
        };
        for (int i = 0; i < latin.length; i += 2) ACCENTS.put(latin[i], latin[i + 1]);
    }

    private static final String[] ARABIC_DIGITS = {"٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"};

    public static Lang get(String code) {
        for (Lang l : ALL) if (l.code.equals(code)) return l;
        return ALL[0];
    }

    public static boolean supported(String code) {
        for (Lang l : ALL) if (l.code.equals(code)) return true;
        return false;
    }

    /** Long-press alternates for a character in a given language, or null. */
    public static String[] alternates(Lang lang, String ch) {
        String base = ch.toLowerCase(Locale.ROOT);
        String acc = ACCENTS.get(base);
        if ("ar".equals(lang.code) && ch.length() == 1 && ch.charAt(0) >= '0' && ch.charAt(0) <= '9') {
            String ad = ARABIC_DIGITS[ch.charAt(0) - '0'];
            return acc == null ? new String[]{ad} : concat(new String[]{ad}, split(acc));
        }
        if (acc == null) return null;
        if ("tr".equals(lang.code) && "i".equals(base)) return new String[]{"ı", "î", "ï", "í"};
        return split(acc);
    }

    static String[] concat(String[] a, String[] b) {
        String[] r = new String[a.length + b.length];
        System.arraycopy(a, 0, r, 0, a.length);
        System.arraycopy(b, 0, r, a.length, b.length);
        return r;
    }

    /** Splits a string into code points. */
    public static String[] split(String s) {
        int n = s.codePointCount(0, s.length());
        String[] out = new String[n];
        int idx = 0, i = 0;
        while (i < s.length()) {
            int cp = s.codePointAt(i);
            int len = Character.charCount(cp);
            out[idx++] = s.substring(i, i + len);
            i += len;
        }
        return out;
    }

    private Languages() {
    }
}
