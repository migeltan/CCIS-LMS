import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { createClient } from '@supabase/supabase-js';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { SUPABASE_CLIENT } from './shared/storage/storage.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: SUPABASE_CLIENT,
      useFactory: () => createClient(environment.supabaseUrl, environment.supabaseAnonKey),
    },
  ],
};
