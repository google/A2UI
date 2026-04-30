package com.amap.agenui;

import android.content.Context;
import android.content.res.AssetManager;
import android.util.Log;

import androidx.annotation.Keep;
import androidx.annotation.RestrictTo;

import com.amap.agenui.function.IFunction;
import com.amap.agenui.function.PlatformFunction;
import com.amap.agenui.render.component.ComponentRegistry;
import com.amap.agenui.render.component.IComponentFactory;
import com.amap.agenui.render.image.ImageLoader;
import com.amap.agenui.render.image.ImageLoaderConfig;
import com.amap.agenui.render.surface.ThemeException;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

@Keep
public class AGenUI {
    private static final String TAG = "AGenUI";

    static {
        System.loadLibrary("amap_AGenUI");
    }

    private static volatile AGenUI sInstance = null;
    private static final Object sLock = new Object();

    private static final String SDK_VERSION = "2.0.0";

    private volatile long nativePtr = 0;
    private volatile boolean isInitialized = false;
    private volatile Context appContext = null;

    /**
     * Private constructor to prevent direct external instantiation
     */
    private AGenUI() {
    }

    /**
     * Returns the AGenUI singleton instance
     *
     * @return AGenUI singleton instance
     */
    public static AGenUI getInstance() {
        if (sInstance == null) {
            synchronized (sLock) {
                if (sInstance == null) {
                    sInstance = new AGenUI();
                }
            }
        }
        return sInstance;
    }

    /**
     * Initializes the AGenUI Engine
     *
     * Performs the following steps:
     * 1. Loads Native modules
     * 2. Creates the Engine instance (initAGenUIEngine)
     * 3. Sets the working directory
     * 4. Copies template files to the sandbox
     * 5. Initializes SkillManager and registers platform Skills
     *
     * @throws RuntimeException if initialization fails
     */
    public void initialize(Context applicationContext) {
        synchronized (sLock) {
            if (isInitialized) {
                Log.w(TAG, "Module already initialized");
                return;
            }

            try {
                appContext = applicationContext.getApplicationContext();
                nativePtr = nativeInitAGenUIEngine();
                Log.i(TAG, "AGenUI Engine created: nativePtr=" + nativePtr);
                nativeSetWorkdir(getInternalFilesDir());
                copyAssetsToSandbox();
                ComponentRegistry.registerBuiltInComponents();

                isInitialized = true;
                Log.i(TAG, "AGenUI Engine initialized successfully");
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize AGenUI Engine", e);
                throw new RuntimeException("Failed to initialize AGenUI Engine", e);
            }
        }
    }

    /**
     * Checks whether the Engine has been initialized
     *
     * @return true if the Engine is initialized
     */
    public boolean isInitialized() {
        return isInitialized && nativePtr != 0;
    }


    /**
     * Creates a SurfaceManager instance
     *
     * @return engineId (instance identifier)
     * @throws IllegalStateException if the Engine is not initialized or the native layer fails to create one
     */
    public int createSurfaceManager() throws IllegalStateException {
        if (!isInitialized()) {
            throw new IllegalStateException("createSurfaceManager: AGenUI engine is not initialized");
        }
        int engineId = nativeCreateSurfaceManager();
        if (engineId == 0) {
            throw new IllegalStateException("createSurfaceManager: native call failed");
        }
        Log.i(TAG, "SurfaceManager created: engineId=" + engineId);
        return engineId;
    }

    /**
     * Destroys a SurfaceManager instance
     *
     * @param engineId The engineId of the SurfaceManager to destroy
     */
    public void destroySurfaceManager(int engineId) {
        if (!isInitialized()) {
            Log.w(TAG, "destroySurfaceManager: Engine not initialized");
            return;
        }
        nativeDestroySurfaceManager(engineId);
        Log.i(TAG, "SurfaceManager destroyed: engineId=" + engineId);
    }


    private boolean isConfigValid(String methodName, String config) {
        if (config == null || config.isEmpty()) {
            Log.w(TAG, methodName + ": config is null or empty");
            return false;
        }
        if (!isInitialized()) {
            Log.e(TAG, methodName + ": Engine not initialized");
            return false;
        }
        return true;
    }

    private boolean loadThemeConfig(String themeConfig) {
        if (!isConfigValid("loadThemeConfig", themeConfig)) {
            return false;
        }
        return nativeLoadThemeConfig(themeConfig);
    }

    private boolean loadDesignTokenConfig(String designTokenConfig) {
        if (!isConfigValid("loadDesignTokenConfig", designTokenConfig)) {
            return false;
        }
        return nativeLoadDesignTokenConfig(designTokenConfig);
    }

    /**
     * Sets the day/night mode
     *
     * @param mode Mode value: "light" or "dark"
     */
    public void setDayNightMode(String mode) {
        if (mode == null || mode.isEmpty()) {
            Log.w(TAG, "setDayNightMode: mode is null or empty");
            return;
        }
        if (!isInitialized()) {
            Log.e(TAG, "setDayNightMode: Engine not initialized");
            return;
        }
        nativeSetDayNightMode(mode);
    }

    /**
     * Registers the default theme configuration
     * <p>
     * Registers both the theme JSON and DesignToken JSON simultaneously.
     *
     * @param theme       Theme configuration JSON string
     * @param designToken DesignToken configuration JSON string
     * @throws ThemeException if registration fails
     */
    public void registerDefaultTheme(String theme, String designToken) throws ThemeException {
        boolean themeOk = loadThemeConfig(theme);
        if (!themeOk) {
            throw new ThemeException("Failed to register theme config");
        }
        boolean tokenOk = loadDesignTokenConfig(designToken);
        if (!tokenOk) {
            throw new ThemeException("Failed to register design token config");
        }
        Log.i(TAG, "✓ Default theme registered successfully");
    }


    public void registerFunction(IFunction function) {
        nativeRegisterFunction(
                function.getConfig().getName(),
                function.getConfig().toJSON(),
                new PlatformFunction(function));
    }

    public void unregisterFunction(String name) {
        nativeUnregisterFunction(name);
    }


    /**
     * Registers a custom component factory
     * <p>
     * If the component type already exists, it will be overwritten. Takes effect immediately
     * after registration and is shared across all Surfaces.
     *
     * @param type    Component type (e.g. "MyCustomCard")
     * @param creator Component factory instance
     */
    public void registerComponent(String type, IComponentFactory creator) {
        if (type == null || type.isEmpty() || creator == null) {
            Log.w(TAG, "registerComponent: invalid parameters");
            return;
        }
        ComponentRegistry.registerComponent(type, creator);
        Log.i(TAG, "registerComponent: type=" + type);
    }

    public void unregisterComponent(String type) {
        if (type == null || type.isEmpty()) {
            Log.w(TAG, "unregisterComponent: invalid parameters");
            return;
        }
        ComponentRegistry.unregisterComponent(type);
        Log.i(TAG, "unregisterComponent: type=" + type);
    }


    /**
     * Registers a global image loader
     * <p>
     * All image components will use this loader to load network images.
     *
     * @param loader ImageLoader instance
     */
    public void registerImageLoader(ImageLoader loader) {
        if (loader == null) {
            Log.w(TAG, "registerImageLoader: loader is null");
            return;
        }
        ImageLoaderConfig.getInstance().setLoader(loader);
        Log.i(TAG, "registerImageLoader: success");
    }


    /**
     * Returns the AGenUI SDK version number
     *
     * @return SDK version number
     */
    public static String getVersion() {
        return SDK_VERSION;
    }


    /**
     * Returns the Native Engine pointer
     *
     * @return Native Engine pointer
     * @throws IllegalStateException if the Engine is not initialized
     */
    public long getNativePtr() {
        if (!isInitialized()) {
            throw new IllegalStateException("Engine not initialized");
        }
        return nativePtr;
    }

    /**
     * Destroys the Engine and releases all Native resources.
     * This method should be called when the application exits.
     */
    public void destroy() {
        synchronized (sLock) {
            if (!isInitialized) {
                Log.w(TAG, "Engine not initialized, nothing to destroy");
                return;
            }

            try {
                if (nativePtr != 0) {
                    nativeDestroyAGenUIEngine();
                    Log.i(TAG, "Engine destroyed successfully");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error destroying engine", e);
            } finally {
                nativePtr = 0;
                isInitialized = false;
                sInstance = null;
            }
        }
    }

    @RestrictTo(androidx.annotation.RestrictTo.Scope.LIBRARY)
    public String getInternalFilesDir() {
        if (appContext == null) {
            throw new IllegalStateException("AGenUI not initialized");
        }
        return appContext.getFilesDir().getAbsolutePath();
    }


    /**
     * Copies template files from assets/agenui to the sandbox ui_templates directory
     */
    private void copyAssetsToSandbox() {
        try {
            String targetDirPath = getInternalFilesDir() + File.separator + "data" + File.separator + "ui_templates";
            File targetDir = new File(targetDirPath);
            if (!targetDir.exists() && !targetDir.mkdirs()) {
                Log.e(TAG, "copyAssetsToSandbox: Failed to create directory: " + targetDirPath);
                return;
            }

            AssetManager assetManager = appContext.getAssets();
            String[] files = assetManager.list("agenui");
            if (files == null || files.length == 0) {
                Log.w(TAG, "copyAssetsToSandbox: No files found in assets/agenui");
                return;
            }

            for (String fileName : files) {
                File targetFile = new File(targetDir, fileName);
                if (targetFile.exists()) {
                    continue;
                }
                InputStream is = null;
                FileOutputStream fos = null;
                try {
                    is = assetManager.open("agenui" + File.separator + fileName);
                    fos = new FileOutputStream(targetFile);
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = is.read(buffer)) != -1) {
                        fos.write(buffer, 0, bytesRead);
                    }
                    fos.flush();
                } catch (IOException e) {
                    Log.e(TAG, "copyAssetsToSandbox: Failed to copy file: " + fileName, e);
                } finally {
                    if (is != null) {
                        try { is.close(); } catch (IOException ignored) {}
                    }
                    if (fos != null) {
                        try { fos.close(); } catch (IOException ignored) {}
                    }
                }
            }
            Log.i(TAG, "copyAssetsToSandbox: Templates copied to " + targetDirPath);
        } catch (Exception e) {
            Log.e(TAG, "copyAssetsToSandbox: Failed to copy assets", e);
        }
    }


    private native long nativeInitAGenUIEngine();
    private native void nativeDestroyAGenUIEngine();

    public static native int nativeCreateSurfaceManager();
    public static native void nativeDestroySurfaceManager(int engineId);

    public static native void nativeSetWorkdir(String workdir);

    private static native boolean nativeLoadThemeConfig(String themeConfig);
    private static native boolean nativeLoadDesignTokenConfig(String designTokenConfig);
    private static native void nativeSetDayNightMode(String mode);

    public static native void nativeRegisterFunction(String name, String config, Object function);
    public static native void nativeUnregisterFunction(String name);
    public static native void nativeOnAsyncCallbackResult(long callbackPtr, int status, String data, String error);
}
