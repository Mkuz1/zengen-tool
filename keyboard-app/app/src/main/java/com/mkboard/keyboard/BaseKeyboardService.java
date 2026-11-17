package com.mkboard.keyboard;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.view.Window;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.inputmethodservice.InputMethodService;
import android.media.AudioManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.text.InputType;
import android.text.TextUtils;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputMethodInfo;
import android.view.inputmethod.InputMethodManager;
import android.view.inputmethod.InputMethodSubtype;
import android.widget.Toast;

import java.util.List;
import java.util.Map;

/** Shared typing engine for both keyboards. Subclasses pick the style and the settings file. */
public abstract class BaseKeyboardService extends InputMethodService
        implements KeyboardView.Listener, SharedPreferences.OnSharedPreferenceChangeListener {

    protected KbPrefs prefs;
    protected KeyboardView view;
    protected Languages.Lang lang;
    protected Suggest suggest;

    private int layer = Layouts.LETTERS;
    private int page = 0;
    private boolean shifted, capsLock, altOn, altLock;
    private long lastShiftTap, lastAltTap, lastSpaceTime;
    private String enterLabel;
    private boolean enterAction;
    private boolean noSuggest;
    private boolean noAutoCap;
    private String curWord = "";
    private String[] sugCommit = new String[3];
    private String[] lastAlts;
    private boolean flashLang;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable endFlash = () -> {
        flashLang = false;
        refresh();
    };

    protected abstract String kind();

    protected abstract int style();

    private boolean ios() {
        return style() == KeyboardView.IOS;
    }

    private boolean tablet() {
        return getResources().getConfiguration().smallestScreenWidthDp >= 600;
    }

    /** iPad-style layout on tablets and unfolded foldables. */
    private boolean wide() {
        return ios() && tablet() && prefs.b(KbPrefs.K_WIDE);
    }

    /** Centre the keys (compact) on wide screens unless the user wants full width. */
    private float maxContentWidth() {
        Configuration c = getResources().getConfiguration();
        float dp = getResources().getDisplayMetrics().density;
        if (prefs.b(KbPrefs.K_WIDE)) return 0;
        if (ios()) return tablet() ? 640 * dp : 0;
        return c.screenWidthDp > 680 ? 640 * dp : 0;
    }

    private boolean glass() {
        return ios() && prefs.b(KbPrefs.K_GLASS);
    }

    private boolean blurAvailable() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return false;
        WindowManager wm = getSystemService(WindowManager.class);
        return wm != null && wm.isCrossWindowBlurEnabled();
    }

    private java.util.function.Consumer<Boolean> blurListener;

    /** Makes the keyboard window a frosted, see-through glass sheet (or opaque for the classic looks). */
    private void configureWindow() {
        if (getWindow() == null) return;
        Window w = getWindow().getWindow();
        if (w == null) return;
        KbTheme t = prefs.theme();
        float dp = getResources().getDisplayMetrics().density;
        boolean glass = glass();
        boolean blur = glass && blurAvailable();
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, null);
        if (glass) {
            int a = KeyboardView.panelAlpha(prefs.glassT(), blur);
            g.setColors(new int[]{KbTheme.withAlpha(KbTheme.lighten(t.bg, 0.12f), a), KbTheme.withAlpha(t.bg, a)});
            float R = 26 * dp;
            g.setCornerRadii(new float[]{R, R, R, R, 0, 0, 0, 0});
        } else {
            g.setColor(t.bg);
        }
        w.setFormat(PixelFormat.TRANSLUCENT);
        w.setBackgroundDrawable(g);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) w.setBackgroundBlurRadius(blur ? (int) (30 * dp) : 0);
        w.setNavigationBarColor(Color.TRANSPARENT);
        w.setNavigationBarContrastEnforced(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController ic = w.getInsetsController();
            if (ic != null) {
                ic.setSystemBarsAppearance(KbTheme.luminance(t.bg) > 0.5f
                                ? WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS : 0,
                        WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
            }
        }
        if (view != null) {
            view.glass = glass;
            view.drawPanel = false;
            view.blurAvailable = blur;
            view.glassT = prefs.glassT();
            view.invalidate();
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = new KbPrefs(this, kind());
        prefs.sp.registerOnSharedPreferenceChangeListener(this);
        suggest = new Suggest(this, kind());
        lang = Languages.get(prefs.curLang());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            WindowManager wm = getSystemService(WindowManager.class);
            if (wm != null) {
                blurListener = enabled -> configureWindow();
                wm.addCrossWindowBlurEnabledListener(getMainExecutor(), blurListener);
            }
        }
        configureWindow();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // folding / unfolding, rotation, tablet multi-window: re-pick the layout for the new size
        if (view != null) {
            applyPrefs();
            rebuild();
            updateShift();
        }
    }

    @Override
    public void onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && blurListener != null) {
            WindowManager wm = getSystemService(WindowManager.class);
            if (wm != null) wm.removeCrossWindowBlurEnabledListener(blurListener);
        }
        prefs.sp.unregisterOnSharedPreferenceChangeListener(this);
        super.onDestroy();
    }

    @Override
    public View onCreateInputView() {
        view = new KeyboardView(this, style());
        view.setListener(this);
        applyPrefs();
        rebuild();
        return view;
    }

    @Override
    public boolean onEvaluateFullscreenMode() {
        return false;
    }

    @Override
    public void onStartInputView(EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        lang = Languages.get(prefs.curLang());
        int cls = info.inputType & InputType.TYPE_MASK_CLASS;
        int var = info.inputType & InputType.TYPE_MASK_VARIATION;
        boolean numeric = cls == InputType.TYPE_CLASS_NUMBER || cls == InputType.TYPE_CLASS_PHONE
                || cls == InputType.TYPE_CLASS_DATETIME;
        capsLock = false;
        shifted = false;
        page = 0;
        if (numeric) {
            if (ios()) {
                layer = Layouts.NUMBERS;
                altOn = altLock = false;
            } else {
                layer = Layouts.LETTERS;
                altOn = altLock = true;
            }
        } else {
            layer = Layouts.LETTERS;
            altOn = altLock = false;
        }
        boolean password = cls == InputType.TYPE_CLASS_TEXT && (var == InputType.TYPE_TEXT_VARIATION_PASSWORD
                || var == InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                || var == InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD);
        noSuggest = numeric || password || cls != InputType.TYPE_CLASS_TEXT
                || var == InputType.TYPE_TEXT_VARIATION_URI;
        noAutoCap = password || var == InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
                || var == InputType.TYPE_TEXT_VARIATION_WEB_EMAIL_ADDRESS || var == InputType.TYPE_TEXT_VARIATION_URI;
        computeEnter(info);
        applyPrefs();
        rebuild();
        updateShift();
        updateSuggestions();
    }

    @Override
    public void onFinishInputView(boolean finishingInput) {
        if (view != null) view.cancelTouch();
        super.onFinishInputView(finishingInput);
    }

    @Override
    public void onUpdateSelection(int oldSelStart, int oldSelEnd, int newSelStart, int newSelEnd,
                                  int candidatesStart, int candidatesEnd) {
        super.onUpdateSelection(oldSelStart, oldSelEnd, newSelStart, newSelEnd, candidatesStart, candidatesEnd);
        updateShift();
        updateSuggestions();
    }

    @Override
    public void onSharedPreferenceChanged(SharedPreferences sp, String key) {
        if (view == null) return;
        lang = Languages.get(prefs.curLang());
        applyPrefs();
        rebuild();
    }

    // ------------------------------------------------------------------ state → view

    private void applyPrefs() {
        if (view == null) return;
        view.setTheme(prefs.theme());
        view.scale = prefs.height();
        view.showPreview = prefs.b(KbPrefs.K_PREVIEW);
        view.showSuggest = prefs.b(KbPrefs.K_PREDICT);
        view.showAltLabels = prefs.b(KbPrefs.K_SHOWALT);
        view.shadows = prefs.b(KbPrefs.K_SHADOW);
        configureWindow();
        view.requestLayout();
    }

    private void computeEnter(EditorInfo ei) {
        int action = ei.imeOptions & EditorInfo.IME_MASK_ACTION;
        boolean noEnter = (ei.imeOptions & EditorInfo.IME_FLAG_NO_ENTER_ACTION) != 0;
        boolean multi = (ei.inputType & InputType.TYPE_TEXT_FLAG_MULTI_LINE) != 0;
        enterLabel = null;
        enterAction = false;
        if (noEnter || multi) return;
        switch (action) {
            case EditorInfo.IME_ACTION_GO: enterLabel = "go"; enterAction = true; break;
            case EditorInfo.IME_ACTION_SEARCH: enterLabel = "search"; enterAction = true; break;
            case EditorInfo.IME_ACTION_SEND: enterLabel = "send"; enterAction = true; break;
            case EditorInfo.IME_ACTION_DONE: enterLabel = "done"; enterAction = true; break;
            case EditorInfo.IME_ACTION_NEXT: enterLabel = "next"; break;
            default: break;
        }
        if (enterLabel != null && ios()) {
            enterLabel = Character.toUpperCase(enterLabel.charAt(0)) + enterLabel.substring(1);
        }
    }

    private void rebuild() {
        if (view == null) return;
        Layouts.Opts o = new Layouts.Opts();
        o.multiLang = prefs.langs().size() > 1;
        o.enterLabel = enterLabel;
        o.page = page;
        o.wide = wide();
        view.maxContentWidth = maxContentWidth();
        view.setLayout(ios() ? Layouts.ios(lang, layer, o) : Layouts.bb(lang, layer, o));
        view.enterAction = enterAction;
        refresh();
    }

    private void refresh() {
        if (view == null) return;
        view.shifted = shifted;
        view.capsLock = capsLock;
        view.altOn = altOn;
        view.altLock = altLock;
        view.spaceLabel = spaceLabel();
        view.locale = lang.locale;
        view.invalidate();
    }

    private String spaceLabel() {
        if (flashLang) return lang.nativeName;
        int pages = Layouts.pages(ios(), layer, wide());
        if (pages > 1) return (page + 1) + " / " + pages;
        if (ios()) return lang.space;
        return prefs.langs().size() > 1 ? lang.nativeName : "";
    }

    private void updateShift() {
        if (view == null) return;
        if (!lang.hasCase || layer != Layouts.LETTERS) {
            if (!lang.hasCase) shifted = false;
            refresh();
            return;
        }
        if (capsLock || noAutoCap || !prefs.b(KbPrefs.K_AUTOCAP)) {
            refresh();
            return;
        }
        InputConnection ic = getCurrentInputConnection();
        EditorInfo ei = getCurrentInputEditorInfo();
        if (ic != null && ei != null) {
            int caps = ic.getCursorCapsMode(TextUtils.CAP_MODE_SENTENCES);
            shifted = caps != 0;
        }
        refresh();
    }

    // ------------------------------------------------------------------ suggestions

    private String trailingWord() {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return "";
        CharSequence b = ic.getTextBeforeCursor(48, 0);
        if (b == null) return "";
        int i = b.length();
        while (i > 0) {
            char c = b.charAt(i - 1);
            if (Character.isLetter(c) || c == '\'' || Character.getType(c) == Character.NON_SPACING_MARK) i--;
            else break;
        }
        return b.subSequence(i, b.length()).toString();
    }

    private String matchCase(String w, String like) {
        if (like.isEmpty() || w == null) return w;
        if (like.length() > 1 && like.equals(like.toUpperCase(lang.locale)) && !like.equals(like.toLowerCase(lang.locale)))
            return w.toUpperCase(lang.locale);
        if (Character.isUpperCase(like.charAt(0)))
            return w.substring(0, 1).toUpperCase(lang.locale) + w.substring(1);
        return w;
    }

    private void updateSuggestions() {
        if (view == null) return;
        sugCommit = new String[3];
        if (!prefs.b(KbPrefs.K_PREDICT) || noSuggest || layer != Layouts.LETTERS) {
            view.setSuggestions(null);
            return;
        }
        String w = trailingWord();
        curWord = w;
        String[] show = new String[3];
        if (w.isEmpty()) {
            String[] st = suggest.starters(lang.code);
            for (int i = 0; i < 3 && i < st.length; i++) {
                show[i] = st[i];
                sugCommit[i] = st[i];
            }
        } else {
            List<String> c = suggest.complete(lang.code, w, lang.locale, 3);
            if (ios()) {
                show[0] = "“" + w + "”";
                sugCommit[0] = w;
                if (c.size() > 0) {
                    sugCommit[1] = matchCase(c.get(0), w);
                    show[1] = sugCommit[1];
                }
                if (c.size() > 1) {
                    sugCommit[2] = matchCase(c.get(1), w);
                    show[2] = sugCommit[2];
                }
            } else {
                int n = 0;
                for (String s : c) {
                    if (n >= 3) break;
                    sugCommit[n] = matchCase(s, w);
                    show[n] = sugCommit[n];
                    n++;
                }
                if (n == 0) {
                    sugCommit[0] = w;
                    show[0] = w;
                }
            }
        }
        view.setSuggestions(show);
    }

    @Override
    public void onSuggestion(int index) {
        if (index < 0 || index >= sugCommit.length || sugCommit[index] == null) return;
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        String word = sugCommit[index];
        ic.beginBatchEdit();
        if (!curWord.isEmpty()) ic.deleteSurroundingText(curWord.length(), 0);
        ic.commitText(word + " ", 1);
        ic.endBatchEdit();
        suggest.learn(lang.code, word, lang.locale);
        if (view != null) feedback(Key.T.CHAR);
    }

    private void learnCurrentWord() {
        String w = trailingWord();
        if (w.length() >= 2 && !noSuggest) suggest.learn(lang.code, w, lang.locale);
    }

    // ------------------------------------------------------------------ feedback

    @Override
    public void onPress(Key k) {
        feedback(k.type);
    }

    private void feedback(Key.T t) {
        if (prefs.b(KbPrefs.K_SOUND)) {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int fx;
                if (t == Key.T.DELETE) fx = AudioManager.FX_KEYPRESS_DELETE;
                else if (t == Key.T.SPACE) fx = AudioManager.FX_KEYPRESS_SPACEBAR;
                else if (t == Key.T.ENTER) fx = AudioManager.FX_KEYPRESS_RETURN;
                else fx = AudioManager.FX_KEYPRESS_STANDARD;
                am.playSoundEffect(fx, -1f);
            }
        }
        if (prefs.b(KbPrefs.K_VIBRATE)) {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                try {
                    if (ios()) v.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK));
                    else v.vibrate(VibrationEffect.createOneShot(18, VibrationEffect.DEFAULT_AMPLITUDE));
                } catch (RuntimeException ignored) {
                }
            }
        }
    }

    // ------------------------------------------------------------------ key handling

    @Override
    public void onKey(Key k) {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        long now = SystemClock.uptimeMillis();
        switch (k.type) {
            case CHAR:
                typeChar(k);
                break;
            case DELETE:
                doDelete();
                break;
            case SPACE:
                doSpace(ic, now);
                break;
            case ENTER:
                learnCurrentWord();
                sendKeyChar('\n');
                if (!ios() && altOn && !altLock) altOn = false;
                break;
            case SHIFT:
                if (capsLock) {
                    capsLock = false;
                    shifted = false;
                } else if (shifted && now - lastShiftTap < 380 && prefs.b(KbPrefs.K_CAPSLOCK)) {
                    capsLock = true;
                } else {
                    shifted = !shifted;
                }
                lastShiftTap = now;
                refresh();
                break;
            case ALT:
                if (altLock) {
                    altLock = false;
                    altOn = false;
                } else if (altOn && now - lastAltTap < 380) {
                    altLock = true;
                } else {
                    altOn = !altOn;
                }
                lastAltTap = now;
                refresh();
                break;
            case NUM:
                layer = Layouts.NUMBERS;
                rebuild();
                updateSuggestions();
                break;
            case LETTERS:
                layer = Layouts.LETTERS;
                page = 0;
                rebuild();
                updateShift();
                updateSuggestions();
                break;
            case MORESYM:
                layer = layer == Layouts.SYMBOLS ? Layouts.NUMBERS : Layouts.SYMBOLS;
                rebuild();
                break;
            case EMOJI:
                layer = Layouts.EMOJI;
                page = 0;
                rebuild();
                updateSuggestions();
                break;
            case SYM:
                layer = Layouts.SYMBOLS;
                page = 0;
                rebuild();
                updateSuggestions();
                break;
            case PREV:
            case NEXT: {
                int pages = Layouts.pages(ios(), layer, wide());
                page = (page + (k.type == Key.T.NEXT ? 1 : -1) + pages) % pages;
                rebuild();
                break;
            }
            case GLOBE:
                nextLanguage();
                break;
            case MIC:
                voice();
                break;
            case HIDE:
                requestHideSelf(0);
                break;
            default:
                break;
        }
    }

    private void commit(String s) {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        boolean wordChar = s.length() > 0 && (Character.isLetter(s.codePointAt(0)) || s.equals("'"));
        if (!wordChar) learnCurrentWord();
        ic.commitText(s, 1);
    }

    private void typeChar(Key k) {
        String s = k.text;
        if (!ios() && altOn && k.alt != null && layer == Layouts.LETTERS) {
            commit(k.alt);
            if (!altLock) altOn = false;
            refresh();
            return;
        }
        if (k.shiftText != null && (shifted || capsLock)) s = k.shiftText;
        else if (k.caseable && (shifted || capsLock)) s = s.toUpperCase(lang.locale);
        commit(s);
        afterChar(s);
    }

    private void afterChar(String s) {
        boolean relayout = false;
        if (shifted && !capsLock) shifted = false;
        if (ios() && (layer == Layouts.NUMBERS || layer == Layouts.SYMBOLS) && "'".equals(s)
                && prefs.b(KbPrefs.K_SYM_RETURN)) {
            layer = Layouts.LETTERS;
            relayout = true;
        }
        if (!ios() && layer == Layouts.SYMBOLS && page < Layouts.BB_SYM.length && prefs.b(KbPrefs.K_SYM_RETURN)) {
            layer = Layouts.LETTERS;
            page = 0;
            relayout = true;
        }
        if (relayout) rebuild();
        else refresh();
    }

    private void doSpace(InputConnection ic, long now) {
        if (prefs.b(KbPrefs.K_DOUBLESPACE) && now - lastSpaceTime < 650) {
            CharSequence b = ic.getTextBeforeCursor(2, 0);
            if (b != null && b.length() == 2 && b.charAt(1) == ' ' && Character.isLetterOrDigit(b.charAt(0))) {
                ic.beginBatchEdit();
                ic.deleteSurroundingText(1, 0);
                ic.commitText(". ", 1);
                ic.endBatchEdit();
                lastSpaceTime = 0;
                return;
            }
        }
        learnCurrentWord();
        ic.commitText(" ", 1);
        lastSpaceTime = now;
        if (ios() && (layer == Layouts.NUMBERS || layer == Layouts.SYMBOLS) && prefs.b(KbPrefs.K_SYM_RETURN)) {
            layer = Layouts.LETTERS;
            rebuild();
        }
        if (!ios() && altOn && !altLock) {
            altOn = false;
            refresh();
        }
    }

    private void doDelete() {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        CharSequence sel = ic.getSelectedText(0);
        if (sel != null && sel.length() > 0) {
            ic.commitText("", 1);
            return;
        }
        sendDownUpKeyEvents(KeyEvent.KEYCODE_DEL);
    }

    private void deleteWord() {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        CharSequence b = ic.getTextBeforeCursor(64, 0);
        if (b == null || b.length() == 0) return;
        int i = b.length();
        while (i > 0 && Character.isWhitespace(b.charAt(i - 1))) i--;
        while (i > 0 && !Character.isWhitespace(b.charAt(i - 1))) i--;
        int n = b.length() - i;
        ic.deleteSurroundingText(Math.max(1, n), 0);
    }

    @Override
    public void onFlick(Key k) {
        if (k.alt == null) return;
        commit(k.alt);
        afterChar(k.alt);
    }

    @Override
    public void onRepeat(Key k, int count) {
        if (count > 22) deleteWord();
        else doDelete();
    }

    @Override
    public void onCursorMove(int dir) {
        sendDownUpKeyEvents(dir > 0 ? KeyEvent.KEYCODE_DPAD_RIGHT : KeyEvent.KEYCODE_DPAD_LEFT);
    }

    // ------------------------------------------------------------------ long press

    @Override
    public String[] alternates(Key k) {
        List<String> langs = prefs.langs();
        if ((k.type == Key.T.GLOBE || (!ios() && k.type == Key.T.SPACE)) && langs.size() > 1) {
            lastAlts = new String[langs.size()];
            for (int i = 0; i < langs.size(); i++) lastAlts[i] = Languages.get(langs.get(i)).nativeName;
            return lastAlts;
        }
        if (k.type != Key.T.CHAR) return null;
        boolean upper = k.caseable && (shifted || capsLock);
        java.util.ArrayList<String> out = new java.util.ArrayList<>();
        if (!ios() && layer == Layouts.LETTERS) {
            if (k.alt != null) out.add(k.alt);
            if (k.caseable) out.add(upper ? k.text.toLowerCase(lang.locale) : k.text.toUpperCase(lang.locale));
        }
        if (k.alts != null) for (String a : k.alts) out.add(upper ? a.toUpperCase(lang.locale) : a);
        if (out.isEmpty()) return null;
        lastAlts = out.toArray(new String[0]);
        return lastAlts;
    }

    @Override
    public boolean onLongPress(Key k) {
        if (k.type == Key.T.GLOBE) {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            if (imm != null) imm.showInputMethodPicker();
            return true;
        }
        return false;
    }

    @Override
    public void onAltSelected(Key k, int index) {
        if (lastAlts == null || index < 0 || index >= lastAlts.length) return;
        if (k.type == Key.T.GLOBE || k.type == Key.T.SPACE) {
            List<String> langs = prefs.langs();
            if (index < langs.size()) setLanguage(langs.get(index));
            return;
        }
        String s = lastAlts[index];
        commit(s);
        if (!ios() && altOn && !altLock) altOn = false;
        afterChar(s);
    }

    // ------------------------------------------------------------------ languages & voice

    private void nextLanguage() {
        List<String> langs = prefs.langs();
        if (langs.size() <= 1) {
            if (!switchToNextInputMethod(false)) {
                InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                if (imm != null) imm.showInputMethodPicker();
            }
            return;
        }
        int i = langs.indexOf(lang.code);
        setLanguage(langs.get((i + 1) % langs.size()));
    }

    private void setLanguage(String code) {
        lang = Languages.get(code);
        layer = Layouts.LETTERS;
        page = 0;
        flashLang = true;
        handler.removeCallbacks(endFlash);
        handler.postDelayed(endFlash, 1400);
        prefs.setCurLang(code);
        rebuild();
        updateShift();
        updateSuggestions();
    }

    private void voice() {
        InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        if (imm != null) {
            for (Map.Entry<InputMethodInfo, List<InputMethodSubtype>> e
                    : imm.getShortcutInputMethodsAndSubtypes().entrySet()) {
                for (InputMethodSubtype st : e.getValue()) {
                    if ("voice".equals(st.getMode())) {
                        switchInputMethod(e.getKey().getId(), st);
                        return;
                    }
                }
            }
            for (InputMethodInfo imi : imm.getEnabledInputMethodList()) {
                for (InputMethodSubtype st : imm.getEnabledInputMethodSubtypeList(imi, true)) {
                    if ("voice".equals(st.getMode()) && !imi.getPackageName().equals(getPackageName())) {
                        switchInputMethod(imi.getId(), st);
                        return;
                    }
                }
            }
        }
        Toast.makeText(this, "No voice-typing keyboard is installed", Toast.LENGTH_SHORT).show();
    }
}
