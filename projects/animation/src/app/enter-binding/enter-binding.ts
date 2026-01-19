import {Component, signal} from '@angular/core';

@Component({
  selector: 'app-enter-binding',
  imports: [],
  templateUrl: './enter-binding.html',
  styleUrl: './enter-binding.scss',
})
export class EnterBinding {

  isShown = signal(false);

  toggle() {
    this.isShown.update((isShown) => !isShown);
  }

  enterClass = signal('enter-animation');
}
