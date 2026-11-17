package com.mkboard.keyboard;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 34)
public class UpdaterParseTest {
    @Test
    public void parsesGithubRelease() throws Exception {
        String json = "{\"tag_name\":\"v2.2.0\",\"draft\":false,\"prerelease\":false,"
                + "\"html_url\":\"https://github.com/Mkuz1/MK-Board-releases/releases/tag/v2.2.0\",\"body\":\"- Faster\","
                + "\"assets\":[{\"name\":\"notes.txt\",\"browser_download_url\":\"x\",\"size\":1},"
                + "{\"name\":\"MKBoard-2.2.0.apk\",\"size\":90000,"
                + "\"browser_download_url\":\"https://github.com/Mkuz1/MK-Board-releases/releases/download/v2.2.0/MKBoard-2.2.0.apk\"}]}";
        Updater.Release r = Updater.parse(json);
        assertEquals("2.2.0", r.version);
        assertEquals("https://github.com/Mkuz1/MK-Board-releases/releases/download/v2.2.0/MKBoard-2.2.0.apk", r.apkUrl);
        assertEquals(90000, r.size);
        assertEquals("- Faster", r.notes);
        assertNull(Updater.parse("{\"tag_name\":\"v9\",\"prerelease\":true}"));
    }
}
