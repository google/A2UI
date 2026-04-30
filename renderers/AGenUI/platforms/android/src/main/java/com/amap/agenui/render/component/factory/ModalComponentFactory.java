package com.amap.agenui.render.component.factory;

import android.content.Context;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.IComponentFactory;
import com.amap.agenui.render.component.impl.ModalComponent;

import java.util.Map;

public class ModalComponentFactory implements IComponentFactory {
    
    @Override
    public A2UIComponent createComponent(Context context, String id, Map<String, Object> properties) {
        return new ModalComponent(id, properties);
    }
    
    @Override
    public String getComponentType() {
        return "Modal";
    }
}