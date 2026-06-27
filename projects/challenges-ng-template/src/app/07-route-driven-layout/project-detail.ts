import {Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {Product} from '../shared/models/product.model';

@Component({
  selector: 'app-project-detail',
  imports: [
    RouterLink
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
  host:{
    '[class]':'theme()'
  }
})
export default class ProjectDetail {

  readonly id = input.required<string>();
  readonly product = input.required<Product>();
  readonly theme = input<string>();
};
