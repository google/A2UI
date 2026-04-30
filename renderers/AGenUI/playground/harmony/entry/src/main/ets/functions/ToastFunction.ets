import { promptAction } from '@kit.ArkUI';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { IFunctionCall, FunctionConfig, FunctionResult } from '@agenui/agenui';

/**
 * App-side Toast function implementation.
 *
 * Implements the current IFunctionCall contract and shows toasts.
 */
export class ToastFunction implements IFunctionCall {
  private config: FunctionConfig;

  constructor() {
    this.config = new FunctionConfig();
    this.config.name = 'toast';
  }

  execute(paramsJson: string): FunctionResult {
    try {
      const args = JSON.parse(paramsJson) as Record<string, Object>;

      // Validate required parameters.
      if (!args['value']) {
        return FunctionResult.createError('Missing required parameter: value');
      }

      const message = args['value'] as string;
      const duration = (args['duration'] as string) || 'short';

      // Validate the duration parameter.
      let durationMs: number;
      if (duration === 'long') {
        durationMs = 3500;
      } else if (duration === 'short') {
        durationMs = 2000;
      } else {
        return FunctionResult.createError(`Invalid duration value: ${duration}. Must be 'short' or 'long'`);
      }

      // Show the toast.
      promptAction.showToast({
        message: message,
        duration: durationMs
      });
      hilog.info(0x0000, 'AGenUI', '[ToastFunction] Toast displayed: %{public}s', message);

      const result: Record<string, Object> = {
        'success': true,
        'message': message,
        'duration': duration
      };
      return FunctionResult.createSuccess(result);
    } catch (e) {
      hilog.error(0x0000, 'AGenUI', '[ToastFunction] execute failed: %{public}s', `${e}`);
      return FunctionResult.createError(`Toast execute failed: ${e}`);
    }
  }

  getConfig(): FunctionConfig {
    return this.config;
  }
}
