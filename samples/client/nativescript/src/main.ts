import {
  bootstrapApplication,
  provideNativeScriptHttpClient,
  provideNativeScriptRouter,
  runNativeScriptAngularApp,
} from "@nativescript/angular";
import { Utils } from "@nativescript/core";
import { ErrorHandler, Injectable, provideZonelessChangeDetection } from "@angular/core";
import { withInterceptorsFromDi } from "@angular/common/http";
import { Catalog, Theme, MessageProcessor } from "@a2ui/nativescript";
import { NativeScriptCatalog } from "./app/catalog";
import { defaultTheme } from "./app/theme";
import "./globals";
import { Root } from "./app/root";
import { routes } from "./app/app.routes";

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {

  handleError(error: Error) {
    // catch all throw's in the callstack and just report them here
    console.error('GlobalErrorHandler', error);
    console.error(error.stack);
  }
}


runNativeScriptAngularApp({
  appModuleBootstrap: () => {
    if (__APPLE__) {
      Utils.ios.setWindowBackgroundColor("#000000");
    }
    return bootstrapApplication(Root, {
      providers: [
        provideNativeScriptHttpClient(withInterceptorsFromDi()),
        provideNativeScriptRouter(routes),
        provideZonelessChangeDetection(),
        // A2UI Renderer providers
        { provide: Catalog, useValue: NativeScriptCatalog },
        { provide: Theme, useValue: defaultTheme },
        MessageProcessor,
        { provide: ErrorHandler, useClass: GlobalErrorHandler}
      ],
    });
  },
});
