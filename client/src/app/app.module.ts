import { BrowserModule } from '@angular/platform-browser';
import { NgModule, NgZone } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { environment } from '../environments/environment';


import { AppComponent } from './app.component';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor(ngZone: NgZone) {
    let cdCounter = 0;
    ngZone.onUnstable.subscribe(() => (performance as any).mark(`ng:cd-${++cdCounter}-start`));
    ngZone.onStable.subscribe(() => {
      if (cdCounter == 0) return;
      (performance as any).measure(`ng:cd-${cdCounter}`, `ng:cd-${cdCounter}-start`)
    });
  }

}
