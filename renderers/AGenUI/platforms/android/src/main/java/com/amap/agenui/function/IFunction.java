package com.amap.agenui.function;

/**
 * Function abstract interface
 *
 * Defines the interface that all Functions must implement.
 * Replaces the original ISkill architecture.
 */
public interface IFunction {

    /**
     * Executes the Function
     *
     * @param jsonString Function parameters (JSON string)
     * @return Execution result
     */
    FunctionResult execute(String jsonString);

    /**
     * Returns the Function configuration
     *
     * @return Function configuration object
     */
    FunctionConfig getConfig();
}
