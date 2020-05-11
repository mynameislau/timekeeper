import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { AppMaterialModule } from './app-material.module';
import { AppComponent } from './app.component';
import { DoughnutComponent } from './components/doughnut/doughnut.component';
import { TimerMessagesComponent } from './components/timer-messages/timer-messages.component';
import { TimerComponent } from './components/timer/timer.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { mainEffects } from './model/main/main.effects';
import { AnyAction, mainReducersMap, MainState } from './model/main/main.model';

@NgModule({
  declarations: [
    AppComponent,
    DoughnutComponent,
    TimerComponent,
    TimerMessagesComponent,
    TopBarComponent,
  ],
  imports: [
    BrowserModule,
    TranslateModule.forRoot({
      defaultLanguage: 'fr',
    }),
    BrowserAnimationsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
    HttpClientModule,
    AppMaterialModule,
    StoreModule.forRoot<MainState, AnyAction>(mainReducersMap, {}),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
    }),
    EffectsModule.forRoot(mainEffects),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
