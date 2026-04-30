package com.amap.agenui.render.component.factory;

import android.content.Context;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.IComponentFactory;
import com.amap.agenui.render.component.impl.ButtonComponent;

import java.util.Map;

public class ButtonComponentFactory implements IComponentFactory {
    
    @Override
    public A2UIComponent createComponent(Context context, String id, Map<String, Object> properties) {
        return new ButtonComponent(context, id, properties);
    }
    
    @Override
    public String getComponentType() {
        return "Button";
    }
}
