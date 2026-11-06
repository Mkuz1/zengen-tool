package com.sab.passw;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipDescription;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PersistableBundle;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Hosts the SAB Passw UI (bundled in assets/www) in a WebView.
 *
 * Offline guarantees:
 *  - The manifest has no INTERNET permission, so Android refuses every network connection.
 *  - Pages are served from the APK by WebViewAssetLoader on a virtual https origin; any other request is refused here too.
 *  - Website links open in the phone's browser app, never inside SAB Passw.
 *  - The vault is stored in this app's private WebView storage; cloud backup and device transfer are disabled.
 */
public class MainActivity extends Activity {

    private static final String ORIGIN_HOST = WebViewAssetLoader.DEFAULT_DOMAIN; // appassets.androidplatform.net
    private static final String START_URL = "https://" + ORIGIN_HOST + "/assets/www/index.html";
    private static final int REQ_OPEN = 41;
    private static final int REQ_SAVE = 42;

    private final Handler main = new Handler(Looper.getMainLooper());
    private WebView web;
    private WebViewAssetLoader loader;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingSaveText;
    private String pendingSaveMsg;
    private boolean pickerOpen;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Keep passwords out of screenshots, screen recordings and the recent-apps preview.
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);

        loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);           // localStorage holds the encrypted vault
        s.setAllowFileAccess(false);
        s.setSupportMultipleWindows(false);
        s.setGeolocationEnabled(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse r = loader.shouldInterceptRequest(request.getUrl());
                if (r != null) return r;
                // Anything that is not a bundled asset is refused.
                return new WebResourceResponse("text/plain", "utf-8", 403, "Offline", null,
                        new ByteArrayInputStream(new byte[0]));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (ORIGIN_HOST.equals(u.getHost())) return false;
                String scheme = u.getScheme();
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, u).addCategory(Intent.CATEGORY_BROWSABLE));
                    } catch (ActivityNotFoundException e) {
                        Toast.makeText(MainActivity.this, "No browser app found", Toast.LENGTH_SHORT).show();
                    }
                }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try {
                    pickerOpen = true;
                    startActivityForResult(i, REQ_OPEN);
                } catch (ActivityNotFoundException e) {
                    pickerOpen = false;
                    fileCallback = null;
                    callback.onReceiveValue(null);
                    Toast.makeText(MainActivity.this, "No file picker available", Toast.LENGTH_SHORT).show();
                }
                return true;
            }
        });

        web.addJavascriptInterface(new Bridge(), "SABNative");
        web.loadUrl(START_URL);
    }

    /** Methods callable from the page as window.SABNative.*. Called on a background thread. */
    private class Bridge {
        @JavascriptInterface
        public void saveFile(String name, String mime, String text, String doneMsg) {
            main.post(() -> {
                pendingSaveText = text;
                pendingSaveMsg = doneMsg;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
                i.putExtra(Intent.EXTRA_TITLE, name);
                try {
                    pickerOpen = true;
                    startActivityForResult(i, REQ_SAVE);
                } catch (ActivityNotFoundException e) {
                    pickerOpen = false;
                    pendingSaveText = null;
                    js("sabToast", "Can't open the save dialog on this phone");
                }
            });
        }

        @JavascriptInterface
        public void copy(String text, boolean sensitive) {
            main.post(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm == null) return;
                ClipData clip = ClipData.newPlainText("SAB Passw", text);
                if (sensitive) {
                    // Hides the value from the clipboard preview on Android 13+.
                    PersistableBundle extras = new PersistableBundle();
                    extras.putBoolean(Build.VERSION.SDK_INT >= 33
                            ? ClipDescription.EXTRA_IS_SENSITIVE : "android.content.extra.IS_SENSITIVE", true);
                    clip.getDescription().setExtras(extras);
                }
                cm.setPrimaryClip(clip);
            });
        }

        @JavascriptInterface
        public void clearClipboard() {
            main.post(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm == null) return;
                if (Build.VERSION.SDK_INT >= 28) cm.clearPrimaryClip();
                else cm.setPrimaryClip(ClipData.newPlainText("", ""));
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        pickerOpen = false;
        Uri uri = (resultCode == RESULT_OK && data != null) ? data.getData() : null;

        if (requestCode == REQ_OPEN) {
            if (fileCallback != null) fileCallback.onReceiveValue(uri != null ? new Uri[]{uri} : null);
            fileCallback = null;
        } else if (requestCode == REQ_SAVE) {
            String text = pendingSaveText;
            String msg = pendingSaveMsg;
            pendingSaveText = null;
            pendingSaveMsg = null;
            if (uri == null || text == null) {
                js("sabToast", "Export cancelled");
                return;
            }
            try (OutputStream os = getContentResolver().openOutputStream(uri, "wt")) {
                if (os == null) throw new java.io.IOException("No output stream");
                os.write(text.getBytes(StandardCharsets.UTF_8));
                js("sabToast", msg != null ? msg : "Exported");
            } catch (Exception e) {
                js("sabToast", "Couldn't save the file: " + e.getMessage());
            }
        }
    }

    /** Calls window[fn](arg) in the page with a safely quoted string argument. */
    private void js(String fn, String arg) {
        web.evaluateJavascript("window." + fn + " && window." + fn + "(" + JSONObject.quote(arg) + ")", null);
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onStop() {
        super.onStop();
        // Lock when the app leaves the screen (if enabled in settings), but not while our own file picker is showing.
        if (!pickerOpen) web.evaluateJavascript("window.sabOnBackground && window.sabOnBackground()", null);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("window.sabBack ? window.sabBack() : false", value -> {
            if (!"true".equals(value)) moveTaskToBack(true);
        });
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.removeJavascriptInterface("SABNative");
            web.destroy();
        }
        super.onDestroy();
    }
}
