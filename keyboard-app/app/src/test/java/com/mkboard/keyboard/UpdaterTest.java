package com.mkboard.keyboard;

import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class UpdaterTest {
    @Test
    public void comparesVersions() {
        assertTrue(Updater.compare("v2.1.1", "2.1.0") > 0);
        assertTrue(Updater.compare("2.10.0", "2.9.9") > 0);
        assertTrue(Updater.compare("v3", "2.99") > 0);
        assertTrue(Updater.compare("2.1", "2.1.0") == 0);
        assertTrue(Updater.compare("2.0.9", "2.1.0") < 0);
        assertTrue(Updater.compare("v2.2.0-beta", "2.1.0") > 0);
    }
}
