package com.skrohan.droprushskypanic;

import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onResume() {
        super.onResume();
        // WebView layout / insets can update after resume; nudge Phaser ScaleManager without a full reload.
        if (getBridge() == null) {
            return;
        }
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            return;
        }
        webView.post(
                () ->
                        webView.evaluateJavascript(
                                "window.dispatchEvent(new Event('resize')); void 0;",
                                null));
    }
}
