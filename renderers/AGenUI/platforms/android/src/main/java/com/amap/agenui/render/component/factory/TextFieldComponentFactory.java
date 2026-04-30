package com.amap.agenui.render.component.factory;

import android.content.Context;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.IComponentFactory;
import com.amap.agenui.render.component.impl.TextFieldComponent;

import java.util.Map;

public class TextFieldComponentFactory implements IComponentFactory {
    
    @Override
    public A2UIComponent createComponent(Context context, String id, Map<String, Object> properties) {
        return new TextFieldComponent(context, id, properties);
    }
    
    @Override
    public String getComponentType() {
        return "TextField";
    }
}
