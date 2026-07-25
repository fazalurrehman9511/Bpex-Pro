package com.flowexch.app;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.FrameLayout;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private View chromeOverlay;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        attachChromeOverlay();
    }

    private void attachChromeOverlay() {
        ViewGroup content = findViewById(android.R.id.content);
        if (content == null) return;

        chromeOverlay = LayoutInflater.from(this).inflate(R.layout.app_chrome_overlay, content, false);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        content.addView(chromeOverlay, lp);

        View home = chromeOverlay.findViewById(R.id.btn_nav_home);
        if (home != null) {
            home.setOnClickListener(v -> goAppTab("home"));
        }

        Bridge bridge = getBridge();
        if (bridge == null || bridge.getWebView() == null) return;

        WebView webView = bridge.getWebView();
        webView.setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                updateChromeVisibility(url);
            }
        });

        updateChromeVisibility(webView.getUrl());
    }

    private void updateChromeVisibility(String url) {
        if (chromeOverlay == null) return;
        String safeUrl = url == null ? "" : url.toLowerCase();
        boolean onBpexch = safeUrl.contains("bpexch");
        boolean onLogin = safeUrl.contains("/users/login") || safeUrl.matches(".*/login([?#].*)?$");
        chromeOverlay.setVisibility(onBpexch && !onLogin ? View.VISIBLE : View.GONE);
    }

    private void goAppTab(String tab) {
        Bridge bridge = getBridge();
        if (bridge == null || bridge.getWebView() == null) return;
        String path = "/?tab=home";
        // Capacitor androidScheme=http → http://localhost
        String appUrl = "http://localhost" + path;
        bridge.getWebView().loadUrl(appUrl);
        if (chromeOverlay != null) {
            chromeOverlay.setVisibility(View.GONE);
        }
    }
}
