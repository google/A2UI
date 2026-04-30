package com.amap.agenuiplayground;

import android.content.Context;
import android.content.res.AssetManager;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Utility class for copying UI Templates resources
 * Responsible for copying the ui_templates directory from Assets to the app sandbox directory
 */
public class UITemplatesCopier {

    private static final String TAG = "UITemplatesCopier";
    private static final String ASSETS_PATH = "ui_templates";
    private static final String DATA_DIR = "data";

    /**
     * Copy ui_templates from Assets to the sandbox directory
     *
     * @param context Application context
     * @return The sandbox root directory path (files directory) after copying, or null on failure
     */
    public static String copyUITemplatesToSandbox(Context context) {
        AssetManager assetManager = context.getAssets();
        File filesDir = context.getFilesDir();

        // Create the data directory
        File dataDir = new File(filesDir, DATA_DIR);
        if (!dataDir.exists()) {
            if (!dataDir.mkdirs()) {
                Log.e(TAG, "❌ Failed to create data directory");
                return null;
            }
        }

        // Target directory
        File destDir = new File(dataDir, ASSETS_PATH);

        // If it already exists, delete it first (to ensure the latest version)
        if (destDir.exists()) {
            Log.i(TAG, "🗑️ Detected existing ui_templates directory, deleting...");
            if (!deleteDirectory(destDir)) {
                Log.e(TAG, "❌ Failed to delete old ui_templates directory");
                return null;
            }
            Log.i(TAG, "✓ Old ui_templates directory deleted");
        }

        // Create the target directory
        if (!destDir.mkdirs()) {
            Log.e(TAG, "❌ Failed to create ui_templates directory");
            return null;
        }

        try {
            // Copy the entire ui_templates directory
            copyAssetFolder(assetManager, ASSETS_PATH, destDir.getAbsolutePath());

            // Count the number of files
            int fileCount = countFiles(destDir);
            Log.i(TAG, "✅ UI Templates copied to sandbox");
            Log.i(TAG, "📁 Target path: " + destDir.getAbsolutePath());
            Log.i(TAG, "📄 File count: " + fileCount);

            return filesDir.getAbsolutePath();

        } catch (IOException e) {
            Log.e(TAG, "❌ Failed to copy UI Templates", e);
            return null;
        }
    }

    /**
     * Recursively copy an Asset folder
     *
     * @param assetManager AssetManager
     * @param srcPath      Source path (relative to the assets directory)
     * @param destPath     Destination path (absolute path)
     * @throws IOException IO exception
     */
    private static void copyAssetFolder(AssetManager assetManager, String srcPath, String destPath) throws IOException {
        String[] files = assetManager.list(srcPath);

        if (files == null || files.length == 0) {
            // It is a file; copy it directly
            copyAssetFile(assetManager, srcPath, destPath);
        } else {
            // It is a directory; copy recursively
            File destDir = new File(destPath);
            if (!destDir.exists()) {
                destDir.mkdirs();
            }

            for (String filename : files) {
                String srcFilePath = srcPath + "/" + filename;
                String destFilePath = destPath + "/" + filename;
                copyAssetFolder(assetManager, srcFilePath, destFilePath);
            }
        }
    }

    /**
     * Copy a single Asset file
     *
     * @param assetManager AssetManager
     * @param srcPath      Source path (relative to the assets directory)
     * @param destPath     Destination path (absolute path)
     * @throws IOException IO exception
     */
    private static void copyAssetFile(AssetManager assetManager, String srcPath, String destPath) throws IOException {
        InputStream in = null;
        OutputStream out = null;

        try {
            in = assetManager.open(srcPath);
            File destFile = new File(destPath);

            // Ensure the parent directory exists
            File parentDir = destFile.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }

            out = new FileOutputStream(destFile);

            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }

            out.flush();
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException e) {
                    // Ignore
                }
            }
            if (out != null) {
                try {
                    out.close();
                } catch (IOException e) {
                    // Ignore
                }
            }
        }
    }

    /**
     * Recursively delete a directory
     *
     * @param directory The directory to delete
     * @return Whether the deletion was successful
     */
    private static boolean deleteDirectory(File directory) {
        if (directory.isDirectory()) {
            File[] files = directory.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (!deleteDirectory(file)) {
                        return false;
                    }
                }
            }
        }
        return directory.delete();
    }

    /**
     * Count the number of files in a directory (recursive)
     *
     * @param directory The directory
     * @return Number of files
     */
    private static int countFiles(File directory) {
        int count = 0;
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isFile()) {
                    count++;
                } else if (file.isDirectory()) {
                    count += countFiles(file);
                }
            }
        }
        return count;
    }
}
