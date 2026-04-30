import { IFunctionCall, FunctionResult } from './IFunctionCall';
import { hilog } from '@kit.PerformanceAnalysisKit';
import {
  registerFunction as napiRegisterFunction,
  unregisterFunction as napiUnregisterFunction
} from 'liba2ui-capi.so';

/**
 * Function manager singleton.
 *
 * Bridges IFunctionCall with the NAPI layer and manages registration
 * and unregistration of host-defined functions.
 */
export class FunctionManager {
  private static _instance: FunctionManager;
  private functions: Map<string, IFunctionCall> = new Map();

  private constructor() {}

  public static getInstance(): FunctionManager {
    if (!FunctionManager._instance) {
      FunctionManager._instance = new FunctionManager();
    }
    return FunctionManager._instance;
  }

  /**
   * Registers a function.
   *
   * @param func IFunctionCall implementation
   */
  public registerFunction(func: IFunctionCall): void {
    const config = func.getConfig();
    const name = config.name;
    if (name.length === 0) {
      hilog.error(0x0000, 'FunctionManager', 'registerFunction failed: name is empty');
      return;
    }

    // Convert FunctionResult into the format expected by the C++ engine.
    const callback = (paramsJson: string): string => {
      try {
        const result: FunctionResult = func.execute(paramsJson);
        if (result.result) {
          return JSON.stringify({ status: 'Success', value: result.value });
        } else {
          return JSON.stringify({ status: 'Error', error: String(result.value) });
        }
      } catch (e) {
        return JSON.stringify({ status: 'Error', error: `Execution failed: ${e}` });
      }
    };

    // The C++ registration API requires a JSON payload with both 'name' and 'returnType'.
    // FunctionConfig only carries 'name', so 'returnType' is fixed to 'object' here.
    const configJson = JSON.stringify({ name: name, returnType: 'object' });
    napiRegisterFunction(name, configJson, callback);

    this.functions.set(name, func);
    hilog.info(0x0000, 'FunctionManager', 'registerFunction success: %{public}s', name);
  }

  /**
   * Unregisters a function
   *
   * @param name Function name
   */
  public unregisterFunction(name: string): void {
    if (this.functions.has(name)) {
      napiUnregisterFunction(name);
      this.functions.delete(name);
      hilog.info(0x0000, 'FunctionManager', 'unregisterFunction success: %{public}s', name);
    }
  }
}
