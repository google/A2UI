import {
  bootstrapApplication,
  provideNativeScriptHttpClient,
  provideNativeScriptRouter,
  runNativeScriptAngularApp,
} from '@nativescript/angular';
import { provideZonelessChangeDetection } from '@angular/core';
import { withInterceptorsFromDi } from '@angular/common/http';
import { App } from './app/app';
import { Catalog, Theme, MessageProcessor } from '@a2ui/nativescript';
import { NativeScriptCatalog } from './app/catalog';
import { defaultTheme } from './app/theme';
import { A2aService } from './app/services/a2a.service';
import { ChatService } from './app/services/chat.service';

runNativeScriptAngularApp({
  appModuleBootstrap: () => {
    return bootstrapApplication(App, {
      providers: [
        provideNativeScriptHttpClient(withInterceptorsFromDi()),
        provideZonelessChangeDetection(),
        // A2UI Renderer providers
        { provide: Catalog, useValue: NativeScriptCatalog },
        { provide: Theme, useValue: defaultTheme },
        MessageProcessor,
        // Chat services
        A2aService,
        ChatService,
      ],
    });
  },
});
