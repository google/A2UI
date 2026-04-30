import { IFunctionCall, FunctionConfig, FunctionResult } from '@agenui/agenui';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { Want, common } from '@kit.AbilityKit';

/**
 * App-side OpenUrl function implementation.
 *
 * Implements the current IFunctionCall contract and opens URLs.
 */
export class OpenUrlFunction implements IFunctionCall {
  private config: FunctionConfig;
  private context: common.UIAbilityContext;

  constructor(context: common.UIAbilityContext) {
    this.context = context;
    this.config = new FunctionConfig();
    this.config.name = 'openUrl';
  }

  execute(paramsJson: string): FunctionResult {
    try {
      const args = JSON.parse(paramsJson) as Record<string, Object>;

      // Validate required parameters.
      if (!args['url']) {
        return FunctionResult.createError('Missing required parameter: url');
      }

      const url = args['url'] as string;
      if (url.length === 0) {
        return FunctionResult.createError('URL cannot be empty');
      }
      if (url.startsWith('@placeholder')) {
        return FunctionResult.createError('URL not correct');
      }

      // Open the URL.
      const want: Want = {
        action: 'ohos.want.action.viewData',
        uri: url
      };
      this.context.startAbility(want);
      hilog.info(0x0000, 'AGenUI', '[OpenUrlFunction] Successfully opened URL: %{public}s', url);

      const result: Record<string, Object> = {
        'success': true,
        'url': url
      };
      return FunctionResult.createSuccess(result);
    } catch (e) {
      hilog.error(0x0000, 'AGenUI', '[OpenUrlFunction] execute failed: %{public}s', `${e}`);
      return FunctionResult.createError(`OpenUrl execute failed: ${e}`);
    }
  }

  getConfig(): FunctionConfig {
    return this.config;
  }
}
