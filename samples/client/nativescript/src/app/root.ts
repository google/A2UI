import { Component, NO_ERRORS_SCHEMA } from "@angular/core";
import {
  NativeScriptCommonModule,
  PageRouterOutlet,
} from "@nativescript/angular";

@Component({
  selector: "ns-root",
  template: `<GridLayout androidOverflowEdge="all-but-right">
    <page-router-outlet actionBarVisibility="never"></page-router-outlet>
  </GridLayout>`,
  imports: [NativeScriptCommonModule, PageRouterOutlet],
  schemas: [NO_ERRORS_SCHEMA],
})
export class Root {}
