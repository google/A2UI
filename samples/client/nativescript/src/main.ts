import {
  bootstrapApplication,
  provideNativeScriptHttpClient,
  provideNativeScriptRouter,
  runNativeScriptAngularApp,
} from '@nativescript/angular';
import { provideZonelessChangeDetection } from '@angular/core';
import { withInterceptorsFromDi } from '@angular/common/http';
// import { routes } from './app/app.routes';
import { App } from './app/app';
import { Catalog } from '@a2ui/nativescript';
import { NativeScriptCatalog } from './app/catalog';

runNativeScriptAngularApp({
  appModuleBootstrap: () => {
    return bootstrapApplication(App, {
      providers: [
        provideNativeScriptHttpClient(withInterceptorsFromDi()),
        // provideNativeScriptRouter(routes),
        provideZonelessChangeDetection(),
        { provide: Catalog, useValue: NativeScriptCatalog },
      ],
    });
  },
});
