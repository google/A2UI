package com.amap.agenui.render.component.factory;

import android.content.Context;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.IComponentFactory;
import com.amap.agenui.render.component.impl.ImageComponent;

import java.util.Map;

public class ImageComponentFactory implements IComponentFactory {
    
    @Override
    public A2UIComponent createComponent(Context context, String id, Map<String, Object> properties) {
        return new ImageComponent(context, id, properties);
    }
    
    @Override
    public String getComponentType() {
        return "Image";
    }
}