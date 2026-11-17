package com.mkboard.keyboard;

public class IosSettingsActivity extends KeyboardSettingsActivity {
    @Override
    protected String kind() {
        return KbPrefs.IOS;
    }
}
