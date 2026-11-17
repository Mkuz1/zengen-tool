package com.mkboard.keyboard;

import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.view.View;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;

import java.io.File;
import java.io.FileOutputStream;

/** Renders keyboards and settings screens to PNG for visual review. */
@RunWith(RobolectricTestRunner.class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = 34, qualifiers = "w411dp-h891dp-xxhdpi")
public class RenderTest {

    private static void save(View v, int w, String name) throws Exception {
        v.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED));
        v.layout(0, 0, v.getMeasuredWidth(), v.getMeasuredHeight());
        Bitmap b = Bitmap.createBitmap(v.getMeasuredWidth(), v.getMeasuredHeight(), Bitmap.Config.ARGB_8888);
        v.draw(new Canvas(b));
        File dir = new File(System.getProperty("shots.dir", "shots"));
        dir.mkdirs();
        try (FileOutputStream o = new FileOutputStream(new File(dir, name + ".png"))) {
            b.compress(Bitmap.CompressFormat.PNG, 100, o);
        }
    }

    private KeyboardView kb(int style, KbTheme t, KeyboardLayout l, String[] sug) {
        Context c = RuntimeEnvironment.getApplication();
        KeyboardView v = new KeyboardView(c, style);
        v.setTheme(t);
        v.setLayout(l);
        v.setSuggestions(sug);
        return v;
    }

    private static KbTheme theme(Presets.Preset p) {
        return new KbTheme(p.bg, p.key, p.special, p.text, p.accent, p.fret, p.alt);
    }

    @Test
    public void renderKeyboards() throws Exception {
        int W = 1233; // 411dp @ xxhdpi
        Layouts.Opts o = new Layouts.Opts();
        Languages.Lang en = Languages.get("en");
        String[] sug = {"“Hel”", "Hello", "Help"};

        KeyboardView v = kb(KeyboardView.IOS, theme(Presets.IOS[0]), Layouts.ios(en, Layouts.LETTERS, o), sug);
        v.spaceLabel = "space";
        v.shifted = true;
        save(v, W, "ios_light_letters");

        v = kb(KeyboardView.IOS, theme(Presets.IOS[1]), Layouts.ios(en, Layouts.LETTERS, o), sug);
        v.spaceLabel = "space";
        save(v, W, "ios_dark_letters");

        o.enterLabel = "Search";
        v = kb(KeyboardView.IOS, theme(Presets.IOS[0]), Layouts.ios(en, Layouts.NUMBERS, o), null);
        v.spaceLabel = "space";
        v.enterAction = true;
        save(v, W, "ios_numbers_search");
        v = kb(KeyboardView.IOS, theme(Presets.IOS[3]), Layouts.ios(en, Layouts.SYMBOLS, o), null);
        v.spaceLabel = "space";
        v.enterAction = true;
        save(v, W, "ios_rose_symbols");
        o.enterLabel = null;
        v = kb(KeyboardView.IOS, theme(Presets.IOS[0]), Layouts.ios(en, Layouts.EMOJI, o), null);
        v.spaceLabel = "1 / 8";
        save(v, W, "ios_emoji");
        o.multiLang = true;
        v = kb(KeyboardView.IOS, theme(Presets.IOS[2]), Layouts.ios(Languages.get("ar"), Layouts.LETTERS, o),
                new String[]{"في", "السلام", "شكرا"});
        v.spaceLabel = "مسافة";
        save(v, W, "ios_midnight_arabic");
        v = kb(KeyboardView.IOS, theme(Presets.IOS[0]), Layouts.ios(Languages.get("de"), Layouts.LETTERS, o), null);
        v.spaceLabel = "Leerzeichen";
        v.capsLock = true;
        save(v, W, "ios_german_capslock");

        o.multiLang = false;
        v = kb(KeyboardView.BB, theme(Presets.BB[0]), Layouts.bb(en, Layouts.LETTERS, o),
                new String[]{"Hello", "Help", "Helping"});
        save(v, W, "bb_classic_letters");
        v = kb(KeyboardView.BB, theme(Presets.BB[1]), Layouts.bb(en, Layouts.LETTERS, o), null);
        v.altOn = true;
        v.showSuggest = false;
        save(v, W, "bb_silver_alt_mode");
        v = kb(KeyboardView.BB, theme(Presets.BB[2]), Layouts.bb(en, Layouts.LETTERS, o), null);
        save(v, W, "bb_pearl_letters");
        o.page = 0;
        v = kb(KeyboardView.BB, theme(Presets.BB[4]), Layouts.bb(en, Layouts.SYMBOLS, o), null);
        v.spaceLabel = "1 / 6";
        save(v, W, "bb_pink_sym");
        o.page = 2;
        v = kb(KeyboardView.BB, theme(Presets.BB[0]), Layouts.bb(en, Layouts.SYMBOLS, o), null);
        v.spaceLabel = "3 / 6";
        save(v, W, "bb_emoji");
        o.page = 0;
        o.multiLang = true;
        v = kb(KeyboardView.BB, theme(Presets.BB[3]), Layouts.bb(Languages.get("ru"), Layouts.LETTERS, o), null);
        v.spaceLabel = "Русский";
        save(v, W, "bb_blue_russian");
    }

    private void shot(Class<? extends Activity> cls, String name) throws Exception {
        Activity a = Robolectric.buildActivity(cls).setup().get();
        View root = a.getWindow().getDecorView();
        View content = ((android.view.ViewGroup) root.findViewById(android.R.id.content)).getChildAt(0);
        // render the full scroll content
        View inner = ((android.view.ViewGroup) content).getChildAt(0);
        inner.setBackgroundColor(((android.graphics.drawable.ColorDrawable) content.getBackground()).getColor());
        save(inner, 1233, name);
    }

    @Test
    public void renderScreens() throws Exception {
        shot(MainActivity.class, "screen_main");
        shot(IosSettingsActivity.class, "screen_ios_settings");
        shot(BbSettingsActivity.class, "screen_bb_settings");
    }

    private static int screenW() {
        return RuntimeEnvironment.getApplication().getResources().getDisplayMetrics().widthPixels;
    }

    /** Draws the keyboard over a soft, already-blurred-looking backdrop to simulate the glass window. */
    private static void saveOver(View v, int w, String name, boolean dark) throws Exception {
        v.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED));
        v.layout(0, 0, v.getMeasuredWidth(), v.getMeasuredHeight());
        int top = (int) (v.getMeasuredHeight() * 0.18f);
        Bitmap b = Bitmap.createBitmap(w, v.getMeasuredHeight() + top, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        android.graphics.Paint p = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        p.setShader(new android.graphics.LinearGradient(0, 0, w, b.getHeight(),
                dark ? new int[]{0xFF0B1E4A, 0xFF3A1060, 0xFF5A0F35} : new int[]{0xFF6FA8FF, 0xFFB08CFF, 0xFFFF8FBF},
                null, android.graphics.Shader.TileMode.CLAMP));
        c.drawRect(0, 0, w, b.getHeight(), p);
        p.setShader(new android.graphics.RadialGradient(w * 0.7f, b.getHeight() * 0.6f, w * 0.35f,
                dark ? 0x9900C8A0 : 0xAAFFE680, 0x00FFFFFF, android.graphics.Shader.TileMode.CLAMP));
        c.drawRect(0, 0, w, b.getHeight(), p);
        p.setShader(null);
        c.translate(0, top);
        v.draw(c);
        File dir = new File(System.getProperty("shots.dir", "shots"));
        dir.mkdirs();
        try (FileOutputStream o = new FileOutputStream(new File(dir, name + ".png"))) {
            b.compress(Bitmap.CompressFormat.PNG, 100, o);
        }
    }

    private KeyboardView glassKb(Presets.Preset pr, KeyboardLayout l, String[] sug, String space) {
        KeyboardView v = kb(KeyboardView.IOS, theme(pr), l, null);
        v.glass = true;
        v.drawPanel = true;
        v.blurAvailable = true;
        v.glassT = 0.55f;
        v.setLayout(l);
        v.setSuggestions(sug);
        v.spaceLabel = space;
        return v;
    }

    @Test
    public void renderGlassPhone() throws Exception {
        Layouts.Opts o = new Layouts.Opts();
        Languages.Lang en = Languages.get("en");
        KeyboardView v = glassKb(Presets.IOS[0], Layouts.ios(en, Layouts.LETTERS, o),
                new String[]{"“Hel”", "Hello", "Help"}, "space");
        v.shifted = true;
        saveOver(v, screenW(), "glass_light_phone", false);
        o.enterLabel = "Send";
        v = glassKb(Presets.IOS[1], Layouts.ios(en, Layouts.LETTERS, o), new String[]{"I", "The", "I'm"}, "space");
        v.enterAction = true;
        saveOver(v, screenW(), "glass_dark_phone", true);
        v = glassKb(Presets.IOS[1], Layouts.ios(en, Layouts.NUMBERS, o), null, "space");
        v.enterAction = true;
        saveOver(v, screenW(), "glass_dark_numbers", true);
    }

    @Test
    @Config(sdk = 34, qualifiers = "w1280dp-h800dp-land-mdpi")
    public void renderTablet() throws Exception {
        Layouts.Opts o = new Layouts.Opts();
        o.wide = true;
        o.multiLang = true;
        Languages.Lang en = Languages.get("en");
        KeyboardView v = glassKb(Presets.IOS[0], Layouts.ios(en, Layouts.LETTERS, o),
                new String[]{"“Hel”", "Hello", "Help"}, "");
        v.shifted = true;
        saveOver(v, screenW(), "tablet_ios_glass", false);
        v = glassKb(Presets.IOS[1], Layouts.ios(en, Layouts.NUMBERS, o), null, "");
        saveOver(v, screenW(), "tablet_ios_numbers", true);
        o.wide = false;
        v = kb(KeyboardView.BB, theme(Presets.BB[0]), Layouts.bb(en, Layouts.LETTERS, o),
                new String[]{"Hello", "Help", "Helping"});
        v.maxContentWidth = 640 * RuntimeEnvironment.getApplication().getResources().getDisplayMetrics().density;
        v.spaceLabel = "English";
        save(v, screenW(), "tablet_bb_centred");
    }

    @Test
    @Config(sdk = 34, qualifiers = "w673dp-h841dp-port-xhdpi")
    public void renderFoldableUnfolded() throws Exception {
        Layouts.Opts o = new Layouts.Opts();
        o.wide = true;
        KeyboardView v = glassKb(Presets.IOS[0], Layouts.ios(Languages.get("en"), Layouts.LETTERS, o),
                new String[]{"I", "The", "I'm"}, "");
        saveOver(v, screenW(), "foldable_ios_glass", false);
        v = glassKb(Presets.IOS[2 + 2], Layouts.ios(Languages.get("ar"), Layouts.LETTERS, o),
                new String[]{"في", "السلام", "شكرا"}, "");
        saveOver(v, screenW(), "foldable_ios_arabic", false);
    }

    @Test
    @Config(sdk = 34, qualifiers = "w891dp-h411dp-land-xxhdpi")
    public void renderLandscapePhone() throws Exception {
        Layouts.Opts o = new Layouts.Opts();
        KeyboardView v = glassKb(Presets.IOS[0], Layouts.ios(Languages.get("en"), Layouts.LETTERS, o),
                new String[]{"I", "The", "I'm"}, "space");
        saveOver(v, screenW(), "landscape_ios_glass", false);
        v = kb(KeyboardView.BB, theme(Presets.BB[1]), Layouts.bb(Languages.get("en"), Layouts.LETTERS, o), null);
        v.maxContentWidth = 640 * RuntimeEnvironment.getApplication().getResources().getDisplayMetrics().density;
        save(v, screenW(), "landscape_bb_centred");
    }
}
