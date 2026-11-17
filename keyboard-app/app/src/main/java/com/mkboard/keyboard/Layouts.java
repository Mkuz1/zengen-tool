package com.mkboard.keyboard;

import com.mkboard.keyboard.Key.T;
import com.mkboard.keyboard.Languages.Lang;

/** Builds the key layouts for both keyboard styles. */
public final class Layouts {
    public static final int LETTERS = 0, NUMBERS = 1, SYMBOLS = 2, EMOJI = 3;

    public static final class Opts {
        public boolean multiLang;
        public String enterLabel;
        public int page;
        /** Tablet / unfolded-foldable layout (iPad style). */
        public boolean wide;
    }

    static final String[] EMOJIS = (
            "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 "
                    + "🤪 🤨 🧐 🤓 😎 🥳 😏 😒 😞 😔 😟 😕 🙁 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 "
                    + "🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 "
                    + "🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 👽 "
                    + "👋 🤚 ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 "
                    + "🙌 👐 🤲 🤝 🙏 💪 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 "
                    + "🔥 ✨ ⭐ 🌟 💫 🎉 🎊 🎁 🎈 🏆 🥇 ⚽ 🏀 🎮 🎵 🎶 📱 💻 📷 💡 📌 ✅ ❌ ⚠️ "
                    + "🌹 🌸 🌺 🌻 🌷 🍀 🌴 🌙 ☀️ 🌈 ☁️ ⚡ ❄️ 🌊 🍕 🍔 🍟 🍩 🍰 ☕ 🍵 🥤 🍉 🍓"
    ).split(" ");

    static final int IOS_EMOJI_PER_PAGE = 24;
    static final int PAD_EMOJI_PER_PAGE = 36;
    static final int BB_EMOJI_PER_PAGE = 30;

    static final String[][][] BB_SYM = {
            {
                    {"1", "2", "3", "4", "5", "6", "7", "8", "9", "0"},
                    {"!", "@", "#", "$", "%", "&", "*", "(", ")", "-"},
                    {"_", "=", "+", ";", ":", "'", "\"", "/", "?", ","}
            },
            {
                    {"€", "£", "¥", "₹", "¢", "§", "¶", "°", "•", "…"},
                    {"[", "]", "{", "}", "<", ">", "\\", "|", "~", "^"},
                    {"¿", "¡", "«", "»", "“", "”", "‘", "’", "`", "©"}
            }
    };

    // BlackBerry alt characters by letter position (Bold / Q-series layout).
    static final String[] BB_ALT1 = {"#", "1", "2", "3", "(", ")", "_", "-", "+", "@"};
    static final String[] BB_ALT2 = {"*", "4", "5", "6", "/", ":", ";", "'", "\""};
    static final String[] BB_ALT3 = {"7", "8", "9", "?", "!", ",", "."};

    public static int pages(boolean ios, int layer, boolean wide) {
        int per = wide ? PAD_EMOJI_PER_PAGE : IOS_EMOJI_PER_PAGE;
        if (ios && layer == EMOJI) return (EMOJIS.length + per - 1) / per;
        if (!ios && layer == SYMBOLS)
            return BB_SYM.length + (EMOJIS.length + BB_EMOJI_PER_PAGE - 1) / BB_EMOJI_PER_PAGE;
        return 1;
    }

    private static Key ch(String s, Lang lang, boolean letters) {
        Key k = new Key(T.CHAR);
        k.text = s;
        k.label = s;
        k.caseable = letters && lang.hasCase;
        k.alts = Languages.alternates(lang, s);
        return k;
    }

    private static Key fn(T t, String label, float w) {
        Key k = new Key(t);
        k.label = label;
        k.weight = w;
        return k;
    }

    private static Key flex(T t, String label) {
        Key k = fn(t, label, 1f);
        k.flex = true;
        return k;
    }

    private static void chars(KeyboardLayout.Row r, String[] cs, Lang lang, boolean letters, float w) {
        for (String c : cs) {
            Key k = ch(c, lang, letters);
            k.weight = w;
            r.add(k);
        }
    }

    // ------------------------------------------------------------------ iPhone style

    public static KeyboardLayout ios(Lang L, int layer, Opts o) {
        if (o.wide) return pad(L, layer, o);
        KeyboardLayout kl = new KeyboardLayout();
        String ret = o.enterLabel != null ? o.enterLabel : L.ret;
        boolean ar = "ar".equals(L.code);

        if (layer == LETTERS) {
            kl.letters = true;
            chars(kl.row(), L.rows[0], L, true, 1f);
            chars(kl.row(), L.rows[1], L, true, 1f);
            KeyboardLayout.Row r3 = kl.row();
            if (L.hasCase) {
                r3.add(fn(T.SHIFT, null, 1.35f));
                r3.add(flex(T.SPACER, null));
            }
            chars(r3, L.rows[2], L, true, 1f);
            r3.add(flex(T.SPACER, null));
            r3.add(fn(T.DELETE, null, 1.35f));
            kl.columns = Math.max(10, Math.max(L.rows[0].length, L.rows[1].length));
            iosBottom(kl, fn(T.NUM, "123", 1.25f), L, ret);
        } else if (layer == NUMBERS || layer == SYMBOLS) {
            boolean num = layer == NUMBERS;
            String[] r1 = num ? Languages.split("1234567890") : Languages.split("[]{}#%^*+=");
            String[] r2 = num ? new String[]{"-", "/", ":", ";", "(", ")", "$", "&", "@", "\""}
                    : new String[]{"_", "\\", "|", "~", "<", ">", "€", "£", "¥", "•"};
            String[] r3 = ar ? new String[]{".", "،", "؟", "!", "'"} : new String[]{".", ",", "?", "!", "'"};
            chars(kl.row(), r1, L, false, 1f);
            chars(kl.row(), r2, L, false, 1f);
            KeyboardLayout.Row row3 = kl.row();
            row3.add(num ? fn(T.MORESYM, "#+=", 1.35f) : fn(T.MORESYM, "123", 1.35f));
            row3.add(flex(T.SPACER, null));
            chars(row3, r3, L, false, 1.4f);
            row3.add(flex(T.SPACER, null));
            row3.add(fn(T.DELETE, null, 1.35f));
            kl.columns = 10;
            iosBottom(kl, fn(T.LETTERS, L.abc, 1.25f), L, ret);
        } else {
            kl.emoji = true;
            kl.columns = 8;
            int start = o.page * IOS_EMOJI_PER_PAGE;
            for (int r = 0; r < 3; r++) {
                KeyboardLayout.Row row = kl.row();
                for (int c = 0; c < 8; c++) {
                    int i = start + r * 8 + c;
                    if (i < EMOJIS.length) {
                        Key k = ch(EMOJIS[i], L, false);
                        k.alts = null;
                        k.bare = true;
                        row.add(k);
                    } else {
                        row.add(fn(T.SPACER, null, 1f));
                    }
                }
            }
            KeyboardLayout.Row b = kl.row();
            b.add(fn(T.LETTERS, L.abc, 1.2f));
            b.add(fn(T.PREV, "‹", 0.9f));
            b.add(flex(T.SPACE, L.space));
            b.add(fn(T.NEXT, "›", 0.9f));
            b.add(fn(T.DELETE, null, 1.2f));
            iosBar(kl);
        }
        return kl;
    }

    private static void iosBottom(KeyboardLayout kl, Key modeKey, Lang L, String ret) {
        float f = kl.columns / 10f;
        KeyboardLayout.Row b = kl.row();
        modeKey.weight *= f;
        b.add(modeKey);
        b.add(fn(T.EMOJI, null, 1.25f * f));
        b.add(flex(T.SPACE, L.space));
        b.add(fn(T.ENTER, ret, 2.5f * f));
        iosBar(kl);
    }

    /** The globe / dictation strip under the keys on modern iPhones. */
    private static void iosBar(KeyboardLayout kl) {
        float f = kl.columns / 10f;
        KeyboardLayout.Row bar = kl.row();
        bar.h = 0.8f;
        Key g = fn(T.GLOBE, null, 1.6f * f);
        g.bare = true;
        Key m = fn(T.MIC, null, 1.6f * f);
        m.bare = true;
        bar.add(g).add(flex(T.SPACER, null)).add(m);
    }

    // ------------------------------------------------------------------ iPad style (tablets & foldables)

    static final String[] PAD_FLICK1 = {"1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="};
    static final String[] PAD_FLICK2 = {"@", "#", "$", "&", "*", "(", ")", "'", "\"", "+", "%"};
    static final String[] PAD_FLICK3 = {"%", "-", "+", "=", "/", ";", ":", "<", ">"};

    private static void flickChars(KeyboardLayout.Row r, String[] cs, String[] flicks, Lang L) {
        for (int i = 0; i < cs.length; i++) {
            Key k = ch(cs[i], L, true);
            if (i < flicks.length) k.alt = flicks[i];
            r.add(k);
        }
    }

    private static Key punct(String s, String shift, Lang L) {
        Key k = ch(s, L, false);
        k.alt = shift;
        k.shiftText = shift;
        return k;
    }

    private static KeyboardLayout pad(Lang L, int layer, Opts o) {
        KeyboardLayout kl = new KeyboardLayout();
        String ret = o.enterLabel != null ? o.enterLabel : L.ret;
        boolean ar = "ar".equals(L.code);
        if (layer == LETTERS) {
            kl.letters = true;
            kl.flick = true;
            int n1 = L.rows[0].length, n2 = L.rows[1].length, n3 = L.rows[2].length;
            kl.columns = Math.max(n1 + 1.6f, Math.max(n2 + 2.1f, n3 + 2 + (L.hasCase ? 2.6f : 1.4f)));
            KeyboardLayout.Row r1 = kl.row();
            flickChars(r1, L.rows[0], PAD_FLICK1, L);
            r1.add(flex(T.DELETE, null));
            KeyboardLayout.Row r2 = kl.row();
            if (n2 < n1) r2.add(fn(T.SPACER, null, 0.45f));
            flickChars(r2, L.rows[1], PAD_FLICK2, L);
            r2.add(flex(T.ENTER, ret));
            KeyboardLayout.Row r3 = kl.row();
            r3.add(L.hasCase ? flex(T.SHIFT, null) : flex(T.SPACER, null));
            flickChars(r3, L.rows[2], PAD_FLICK3, L);
            r3.add(punct(ar ? "،" : ",", "!", L));
            r3.add(punct(".", ar ? "؟" : "?", L));
            r3.add(L.hasCase ? flex(T.SHIFT, null) : flex(T.SPACER, null));
            padBottom(kl, ".?123", T.NUM);
        } else if (layer == NUMBERS || layer == SYMBOLS) {
            boolean num = layer == NUMBERS;
            kl.columns = 11.6f;
            KeyboardLayout.Row r1 = kl.row();
            chars(r1, num ? Languages.split("1234567890") : Languages.split("€£¥_^[]{}•"), L, false, 1f);
            r1.add(flex(T.DELETE, null));
            KeyboardLayout.Row r2 = kl.row();
            r2.add(fn(T.SPACER, null, 0.45f));
            chars(r2, num ? new String[]{"@", "#", "$", "&", "*", "(", ")", "'", "\""}
                    : new String[]{"§", "|", "~", "…", "\\", "<", ">", "!", "?"}, L, false, 1f);
            r2.add(flex(T.ENTER, ret));
            KeyboardLayout.Row r3 = kl.row();
            r3.add(flex(T.MORESYM, num ? "#+=" : "123"));
            chars(r3, num ? new String[]{"%", "-", "+", "=", "/", ";", ":", ar ? "،" : ",", "."}
                    : new String[]{"¢", "©", "®", "™", "°", "¶", "¿", "¡", "'"}, L, false, 1f);
            r3.add(flex(T.MORESYM, num ? "#+=" : "123"));
            padBottom(kl, L.abc, T.LETTERS);
        } else {
            kl.emoji = true;
            kl.columns = 12;
            int start = o.page * PAD_EMOJI_PER_PAGE;
            for (int r = 0; r < 3; r++) {
                KeyboardLayout.Row row = kl.row();
                for (int c = 0; c < 12; c++) {
                    int i = start + r * 12 + c;
                    if (i < EMOJIS.length) {
                        Key k = ch(EMOJIS[i], L, false);
                        k.alts = null;
                        k.bare = true;
                        row.add(k);
                    } else row.add(fn(T.SPACER, null, 1f));
                }
            }
            KeyboardLayout.Row b = kl.row();
            b.add(fn(T.LETTERS, L.abc, 1.6f));
            b.add(fn(T.PREV, "‹", 1.1f));
            b.add(flex(T.SPACE, L.space));
            b.add(fn(T.NEXT, "›", 1.1f));
            b.add(fn(T.DELETE, null, 1.6f));
            b.add(fn(T.HIDE, null, 1.3f));
        }
        return kl;
    }

    private static void padBottom(KeyboardLayout kl, String modeLabel, T modeType) {
        float f = kl.columns / 11.6f;
        KeyboardLayout.Row b = kl.row();
        b.add(fn(modeType, modeLabel, 1.6f * f));
        b.add(fn(T.EMOJI, null, 1.1f * f));
        b.add(fn(T.GLOBE, null, 1.1f * f));
        b.add(fn(T.MIC, null, 1.1f * f));
        b.add(flex(T.SPACE, null));
        b.add(fn(modeType, modeLabel, 1.6f * f));
        b.add(fn(T.HIDE, null, 1.3f * f));
    }

    // ------------------------------------------------------------------ BlackBerry style

    public static KeyboardLayout bb(Lang L, int layer, Opts o) {
        KeyboardLayout kl = new KeyboardLayout();
        if (layer == LETTERS) {
            kl.letters = true;
            KeyboardLayout.Row r1 = kl.row();
            addBb(r1, L.rows[0], BB_ALT1, L);
            KeyboardLayout.Row r2 = kl.row();
            addBb(r2, L.rows[1], BB_ALT2, L);
            r2.add(fn(T.DELETE, null, 1f));
            KeyboardLayout.Row r3 = kl.row();
            r3.add(fn(T.ALT, "alt", 1f));
            addBb(r3, L.rows[2], BB_ALT3, L);
            Key dollar = ch("$", L, false);
            r3.add(dollar);
            r3.add(fn(T.ENTER, null, 1f));
            KeyboardLayout.Row r4 = kl.row();
            r4.add(fn(T.SHIFT, null, 1.4f));
            Key zero = ch("0", L, false);
            zero.weight = 1.2f;
            r4.add(zero);
            r4.add(flex(T.SPACE, null));
            r4.add(fn(T.SYM, "sym", 1.4f));
            r4.add(o.multiLang ? fn(T.GLOBE, null, 1.4f) : fn(T.SHIFT, null, 1.4f));
            kl.columns = Math.max(10, Math.max(r1.keys.size(), Math.max(r2.keys.size(), r3.keys.size())));
        } else {
            kl.columns = 10;
            int page = o.page;
            if (page < BB_SYM.length) {
                for (String[] row : BB_SYM[page]) chars(kl.row(), row, L, false, 1f);
            } else {
                kl.emoji = true;
                int start = (page - BB_SYM.length) * BB_EMOJI_PER_PAGE;
                for (int r = 0; r < 3; r++) {
                    KeyboardLayout.Row row = kl.row();
                    for (int c = 0; c < 10; c++) {
                        int i = start + r * 10 + c;
                        if (i < EMOJIS.length) {
                            Key k = ch(EMOJIS[i], L, false);
                            k.alts = null;
                            row.add(k);
                        } else row.add(fn(T.SPACER, null, 1f));
                    }
                }
            }
            KeyboardLayout.Row b = kl.row();
            b.add(fn(T.LETTERS, "abc", 1.5f));
            b.add(fn(T.PREV, "◂", 1.1f));
            b.add(flex(T.SPACE, null));
            b.add(fn(T.NEXT, "▸", 1.1f));
            b.add(fn(T.DELETE, null, 1.5f));
        }
        return kl;
    }

    private static void addBb(KeyboardLayout.Row r, String[] letters, String[] alts, Lang L) {
        for (int i = 0; i < letters.length; i++) {
            Key k = ch(letters[i], L, true);
            if (i < alts.length) k.alt = alts[i];
            r.add(k);
        }
    }

    private Layouts() {
    }
}
