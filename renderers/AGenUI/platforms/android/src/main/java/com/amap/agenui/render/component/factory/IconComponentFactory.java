package com.amap.agenui.render.component.factory;

import android.content.Context;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.IComponentFactory;
import com.amap.agenui.render.component.impl.IconComponent;

import java.util.Map;

public class IconComponentFactory implements IComponentFactory {
    
    @Override
    public A2UIComponent createComponent(Context context, String id, Map<String, Object> properties) {
        return new IconComponent(context, id, properties);
    }
    
    @Override
    public String getComponentType() {
        return "Icon";
    }
}