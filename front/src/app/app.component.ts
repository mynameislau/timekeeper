import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import en from '../assets/i18n/en.json';
import fr from '../assets/i18n/fr.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'timer-test';

  constructor(translate: TranslateService) {
    translate.addLangs(['en', 'fr']);
    translate.setTranslation('en', en);
    translate.setTranslation('fr', fr);
    translate.setDefaultLang('en');
    translate.use('fr');
  }
}
