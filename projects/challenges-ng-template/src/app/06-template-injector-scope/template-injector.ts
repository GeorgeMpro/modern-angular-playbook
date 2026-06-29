import {Component} from '@angular/core';
import {PageLayout} from './page-layout';
import {ThemeReader} from './theme-reader.directive';


@Component({
  selector: 'app-template-injector',
  imports: [
    PageLayout,
    ThemeReader,
  ],
  templateUrl: './template-injector.html',
  styleUrl: './template-injector.scss',
})
export default class TemplateInjector {

}
