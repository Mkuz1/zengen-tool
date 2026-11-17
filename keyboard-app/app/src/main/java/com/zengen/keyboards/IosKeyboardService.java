package com.zengen.keyboards;

/** iPhone-style keyboard. */
public class IosKeyboardService extends BaseKeyboardService {
    @Override
    protected String kind() {
        return KbPrefs.IOS;
    }

    @Override
    protected int style() {
        return KeyboardView.IOS;
    }
}
