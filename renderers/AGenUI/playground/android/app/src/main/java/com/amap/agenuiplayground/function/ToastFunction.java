package com.amap.agenuiplayground.function;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.util.Log;
import android.widget.Toast;

import com.amap.agenui.function.FunctionConfig;
import com.amap.agenui.function.FunctionResult;
import com.amap.agenui.function.IFunction;

import org.json.JSONException;
import org.json.JSONObject;

public class ToastFunction implements IFunction {

    private final Context context;
    private final Handler handler = new Handler(Looper.getMainLooper());

    public ToastFunction(Context context) {
        this.context = context;
    }

    @Override
    public FunctionResult execute(String jsonString) {
        try {
            JSONObject object = new JSONObject(jsonString);
            String toastString = object.optString("value", null);
            if (!TextUtils.isEmpty(toastString)) {
                handler.post(() -> {
                    Toast.makeText(context, toastString, Toast.LENGTH_LONG).show();
                });
            }
        } catch (JSONException exception) {
            return FunctionResult.createError(Log.getStackTraceString(exception));
        }
        return FunctionResult.createSuccess(null);
    }

    @Override
    public FunctionConfig getConfig() {
        return new FunctionConfig("toast");
    }
}
