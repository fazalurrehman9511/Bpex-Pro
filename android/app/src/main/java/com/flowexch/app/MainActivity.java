package com.flowexch.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private View chromeOverlay;
    private WebView bridgeWebView;
    private boolean chromeClientAttached = false;
    private final Handler chromeHandler = new Handler(Looper.getMainLooper());
    private String lastChromeUrl = "";
    private final Runnable chromeWatcher = new Runnable() {
        @Override
        public void run() {
            if (bridgeWebView != null) {
                String url = bridgeWebView.getUrl();
                if (url == null) url = "";
                updateChromeVisibility(url);
                lastChromeUrl = url;
                chromeHandler.postDelayed(this, 350);
            }
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        attachChromeOverlay();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Capacitor may replace WebViewClient after external bpexch.xyz navigation.
        attachChromeWebViewClient();
        if (bridgeWebView != null) {
            updateChromeVisibility(bridgeWebView.getUrl());
        }
        chromeHandler.removeCallbacks(chromeWatcher);
        chromeHandler.post(chromeWatcher);
    }

    @Override
    public void onPause() {
        chromeHandler.removeCallbacks(chromeWatcher);
        super.onPause();
    }

    private void attachChromeOverlay() {
        ViewGroup content = findViewById(android.R.id.content);
        if (content == null) return;

        if (chromeOverlay == null) {
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
        }

        Bridge bridge = getBridge();
        if (bridge == null || bridge.getWebView() == null) return;

        bridgeWebView = bridge.getWebView();
        attachChromeWebViewClient();
        chromeHandler.removeCallbacks(chromeWatcher);
        chromeHandler.post(chromeWatcher);
        updateChromeVisibility(bridgeWebView.getUrl());
    }

    private void attachChromeWebViewClient() {
        Bridge bridge = getBridge();
        if (bridge == null || bridge.getWebView() == null) return;

        WebView webView = bridge.getWebView();
        bridgeWebView = webView;
        WebViewClient current = webView.getWebViewClient();
        if (chromeClientAttached && current instanceof ChromeAwareWebViewClient) return;

        webView.setWebViewClient(new ChromeAwareWebViewClient(bridge));
        chromeClientAttached = true;
    }

    private void updateChromeVisibility(String url) {
        if (chromeOverlay == null) return;
        String safeUrl = url == null ? "" : url.toLowerCase();
        boolean onBpexch = safeUrl.contains("bpexch");
        int next = onBpexch ? View.VISIBLE : View.GONE;
        if (chromeOverlay.getVisibility() != next) {
            chromeOverlay.setVisibility(next);
        }
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
        lastChromeUrl = appUrl;
    }

    private boolean launchExternalUrl(Uri uri) {
        if (uri == null) return false;

        String scheme = uri.getScheme();
        if (scheme != null && scheme.equalsIgnoreCase("whatsapp")) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }

        String host = uri.getHost();
        if (host == null) return false;
        String lowerHost = host.toLowerCase();
        if (lowerHost.equals("wa.me")
                || lowerHost.equals("api.whatsapp.com")
                || lowerHost.equals("whatsapp.com")
                || lowerHost.endsWith(".whatsapp.com")) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }

        return false;
    }

    private class ChromeAwareWebViewClient extends BridgeWebViewClient {
        ChromeAwareWebViewClient(Bridge bridge) {
            super(bridge);
        }

        private void syncChrome(String url) {
            lastChromeUrl = url == null ? "" : url;
            updateChromeVisibility(url);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (request != null && launchExternalUrl(request.getUrl())) {
                return true;
            }
            return super.shouldOverrideUrlLoading(view, request);
        }

        @Override
        @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            if (launchExternalUrl(Uri.parse(url))) {
                return true;
            }
            return super.shouldOverrideUrlLoading(view, url);
        }

        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            syncChrome(url);
        }

        @Override
        public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
            super.doUpdateVisitedHistory(view, url, isReload);
            syncChrome(url);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            syncChrome(url);
        }
    }

    @Override
    public void onDestroy() {
        chromeHandler.removeCallbacks(chromeWatcher);
        super.onDestroy();
    }
}
