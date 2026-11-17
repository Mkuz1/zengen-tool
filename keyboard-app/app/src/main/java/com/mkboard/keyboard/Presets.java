package com.mkboard.keyboard;

/** Built-in colour themes for each keyboard. */
public final class Presets {
    public static final class Preset {
        public final String name;
        public final int bg, key, special, text, accent, fret, alt;

        Preset(String name, int bg, int key, int special, int text, int accent, int fret, int alt) {
            this.name = name;
            this.bg = 0xFF000000 | bg;
            this.key = 0xFF000000 | key;
            this.special = 0xFF000000 | special;
            this.text = 0xFF000000 | text;
            this.accent = 0xFF000000 | accent;
            this.fret = 0xFF000000 | fret;
            this.alt = 0xFF000000 | alt;
        }
    }

    public static final Preset[] IOS = {
            new Preset("Liquid Light", 0xF2F3F7, 0xFFFFFF, 0xE4E6EC, 0x000000, 0x0A84FF, 0x8E8E93, 0x8E8E93),
            new Preset("Liquid Dark", 0x1C1C1E, 0x6E6E73, 0x48484C, 0xFFFFFF, 0x0A84FF, 0x8E8E93, 0x8E8E93),
            new Preset("Classic Light", 0xD1D4DB, 0xFFFFFF, 0xACB1BB, 0x000000, 0x007AFF, 0x8E8E93, 0x8E8E93),
            new Preset("Classic Dark", 0x2B2B2D, 0x6B6B6E, 0x464648, 0xFFFFFF, 0x0A84FF, 0x8E8E93, 0x8E8E93),
            new Preset("Midnight", 0x101828, 0x2A3550, 0x1C2538, 0xE8EEFF, 0x5E8BFF, 0x8E8E93, 0x8E8E93),
            new Preset("Rose", 0xF7D9E3, 0xFFFFFF, 0xE8B4C6, 0x4A1730, 0xFF2D74, 0x8E8E93, 0x8E8E93),
            new Preset("Mint", 0xD3EFE4, 0xFFFFFF, 0xA9D9C6, 0x0F3B2E, 0x00A86B, 0x8E8E93, 0x8E8E93),
            new Preset("Lavender", 0xE3DDF5, 0xFFFFFF, 0xC2B7E6, 0x2B1F55, 0x7B5CFF, 0x8E8E93, 0x8E8E93),
            new Preset("Sunset", 0xFFE1C7, 0xFFFFFF, 0xF6B98A, 0x4A2208, 0xFF7A00, 0x8E8E93, 0x8E8E93),
            new Preset("Graphite", 0x3A3A3C, 0x5A5A5E, 0x2C2C2E, 0xF2F2F7, 0xFF9F0A, 0x8E8E93, 0x8E8E93),
            new Preset("Ocean", 0xCFE6F7, 0xFFFFFF, 0x9CC5E6, 0x0B2A44, 0x0A84FF, 0x8E8E93, 0x8E8E93),
            new Preset("Gold", 0x1E1A12, 0x4A4130, 0x332C1F, 0xFFF4D6, 0xD4AF37, 0x8E8E93, 0x8E8E93),
    };

    public static final Preset[] BB = {
            new Preset("Classic Black", 0x0B0B0C, 0x2A2A2D, 0x1A1A1C, 0xFFFFFF, 0x1E90FF, 0xA8A8AE, 0x8FC3FF),
            new Preset("Bold Silver", 0x1C1D20, 0x3A3C42, 0x2A2B30, 0xFFFFFF, 0x3FA9F5, 0xD9DCE2, 0xB9C4D6),
            new Preset("Pearl White", 0xE3E4E8, 0xFBFBFC, 0xD2D4DA, 0x1A1A1A, 0x0070D1, 0x8E929A, 0x2F6FB8),
            new Preset("Curve Blue", 0x0A1A33, 0x17325E, 0x102445, 0xFFFFFF, 0x3DA5FF, 0x7F95B8, 0x9AD0FF),
            new Preset("Pink", 0x2A0E1C, 0x5A1F3C, 0x3D142A, 0xFFFFFF, 0xFF4FA0, 0xD9A1BD, 0xFFB3D6),
            new Preset("Red Bold", 0x1A0606, 0x4A1010, 0x300A0A, 0xFFFFFF, 0xFF3B30, 0xCC9999, 0xFF9C94),
            new Preset("Emerald", 0x06180F, 0x124A30, 0x0B3020, 0xFFFFFF, 0x2ECC71, 0x9CC9B0, 0xA6F0C6),
            new Preset("Gold", 0x1A1408, 0x4A3A14, 0x30260C, 0xFFF6DC, 0xF5B700, 0xD9C38A, 0xFFE08A),
            new Preset("Purple", 0x140A26, 0x35205C, 0x241540, 0xFFFFFF, 0xA66BFF, 0xB3A1D9, 0xD2B8FF),
            new Preset("Carbon Orange", 0x111111, 0x2C2C2C, 0x1C1C1C, 0xFFFFFF, 0xFF7A00, 0x9A9A9A, 0xFFB066),
    };

    public static Preset[] forKind(String kind) {
        return KbPrefs.IOS.equals(kind) ? IOS : BB;
    }

    private Presets() {
    }
}
