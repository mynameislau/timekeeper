import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss'],
})
export class TopBarComponent implements OnInit {
  constructor(public translate: TranslateService) {}

  menuClick (lang:string) {
    this.translate.use(lang);
  }

  ngOnInit(): void {}
}
