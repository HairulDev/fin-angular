import { Component } from '@angular/core';

import DashboardComponent from './home/index.page';

@Component({
  selector: 'app-home',
  imports: [DashboardComponent],
  template: `
     <app-dashboard/>
  `,
})
export default class HomeComponent {
}
