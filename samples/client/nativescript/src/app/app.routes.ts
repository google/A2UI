import { Routes } from '@angular/router';
import { App } from './app';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: App },
];
