package com.zengen.keyboards;

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
}
