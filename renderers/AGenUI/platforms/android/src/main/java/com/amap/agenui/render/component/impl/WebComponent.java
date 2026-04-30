package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.util.Log;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.amap.agenui.render.component.A2UIComponent;

import java.util.Map;

/**
 * Web component implementation
 * <p>
 * Based on the system native WebView for displaying web content
 * <p>
 * Supported properties:
 * - source: Web address or HTML content (required)
 *   - If it starts with http:// or https://, it is loaded as a URL
 *   - Otherwise it is loaded directly as HTML content
 * <p>
 * Usage examples:
 * Load URL:
 * {
 * "id": "web1",
 * "component": "Web",
 * "source": "https://www.example.com"
 * }
 * <p>
 * Load HTML:
 * {
 * "id": "web2",
 * "component": "Web",
 * "source": "<html><body><h1>Hello World</h1></body></html>"
 * }
 *
 */
public class WebComponent extends A2UIComponent {

    private static final String TAG = "WebComponent";
    private static final int MAX_HEIGHT_DP = 300; // Maximum height 300dp

    private Context context;
    private WebView webView;
    private int lastContentHeight = 0;

    public WebComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Web");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        webView = new WebView(context);

        // Configure WebView settings
        WebSettings webSettings = webView.getSettings();

        // Enable JavaScript
        webSettings.setJavaScriptEnabled(true);

        // Enable zoom
        webSettings.setSupportZoom(true);
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false); // Hide zoom buttons

        // Fit to screen
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);

        // Enable DOM Storage
        webSettings.setDomStorageEnabled(true);

        // Set cache mode
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Set WebViewClient (open links within the current WebView)
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.i(TAG, "WebView page loaded: " + getId());
                // Adjust WebView height to fit content after page load
                adjustWebViewHeight();
            }
        });

        // Set WebChromeClient to capture JavaScript console logs
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                String message = consoleMessage.message();

                // Check if this is a height change notification
                if (message != null && message.startsWith("A2UI_HEIGHT_CHANGE:")) {
                    try {
                        String heightStr = message.substring("A2UI_HEIGHT_CHANGE:".length());
                        int newHeight = Integer.parseInt(heightStr);
                        Log.d(TAG, "🔄 [HEIGHT_CHANGE] WebView " + getId() +
                                " detected content height change: " + newHeight + "px");

                        // Update WebView height in real time
//                        updateWebViewHeight(newHeight);
                    } catch (NumberFormatException e) {
                        Log.e(TAG, "❌ [HEIGHT_CHANGE] Failed to parse height change: " + message);
                    }
                } else {
                    // Regular console log
                    Log.d(TAG, "WebView Console [" + getId() + "]: " +
                            message + " -- From line " +
                            consoleMessage.lineNumber() + " of " + consoleMessage.sourceId());
                }
                return true;
            }
        });

        // Apply initial properties
        onUpdateProperties(this.properties);

        return webView;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        if (webView == null) {
            return;
        }

        // Update source (supports URL or HTML content)
        if (properties.containsKey("source")) {
            String source = String.valueOf(properties.get("source"));
            if (source != null && !source.isEmpty() && !source.equals("null")) {
                // Determine whether it is a URL or HTML content
                if (source.startsWith("http://") || source.startsWith("https://")) {
                    // Load as URL
                    Log.i(TAG, "Loading URL: " + source + " for component: " + getId());
                    webView.loadUrl(source);
                } else {
                    // Load as HTML content
                    Log.i(TAG, "Loading HTML content for component: " + getId());
                    webView.loadDataWithBaseURL(null, source, "text/html", "UTF-8", null);
                }
            }
        }
    }

    /**
     * Adjust WebView height to fit content height
     */
    private void adjustWebViewHeight() {
        // Inject JavaScript to get the actual height of the page content
        String jsCode =
                "(function() {" +
                        "    return document.body.offsetHeight;" +
                        "})();";

        webView.evaluateJavascript(jsCode, new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String value) {
                try {
                    // Parse the returned height value
                    int contentHeight = Integer.parseInt(value);
                    if (contentHeight != lastContentHeight) {
                        lastContentHeight = contentHeight;
                    }
                } catch (NumberFormatException e) {
                    Log.e(TAG, "❌ [HEIGHT_ADJUST] Failed to parse content height: " + value + ", componentId: " + getId());
                } catch (Exception e) {
                    Log.e(TAG, "❌ [HEIGHT_ADJUST] Exception while adjusting WebView height: " + e.getMessage() +
                            ", componentId: " + getId());
                }
            }
        });
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.clearHistory();
            webView.clearCache(true);
            webView.loadUrl("about:blank");
            webView.removeAllViews();
            webView.destroy();
            webView = null;
        }
    }
}
