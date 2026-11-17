package com.mkboard.keyboard;

/** BlackBerry-style keyboard. */
public class BbKeyboardService extends BaseKeyboardService {
    @Override
    protected String kind() {
        return KbPrefs.BB;
    }

    @Override
    protected int style() {
        return KeyboardView.BB;
    }
}
