package com.amap.agenuiplayground.component.factory;

import android.content.Context;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.IComponentFactory;
import com.amap.agenuiplayground.component.impl.ChartComponent;

import java.util.Map;

public class ChartComponentFactory implements IComponentFactory {

    @Override
    public A2UIComponent createComponent(Context context, String id, Map<String, Object> properties) {
        return new ChartComponent(context, id, properties);
    }

    @Override
    public String getComponentType() {
        return "Chart";
    }
}