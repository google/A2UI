/**
 * Function configuration.
 */
export class FunctionConfig {
  name: string = '';
}

/**
 * Function execution result.
 * - When result=true, value contains the result object.
 * - When result=false, value contains an error message.
 */
export class FunctionResult {
  result: boolean = false;
  value: object | string | undefined = undefined;

  static createSuccess(value: object): FunctionResult {
    const r = new FunctionResult();
    r.result = true;
    r.value = value;
    return r;
  }

  static createError(error: string): FunctionResult {
    const r = new FunctionResult();
    r.result = false;
    r.value = error;
    return r;
  }
}

/**
 * Implemented by host code and registered through FunctionManager.
 */
export interface IFunctionCall {
  execute(paramsJson: string): FunctionResult;
  getConfig(): FunctionConfig;
}
