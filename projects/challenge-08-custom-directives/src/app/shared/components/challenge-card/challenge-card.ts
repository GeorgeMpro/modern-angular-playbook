import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChallengeDescriptor } from '../../models/challenge.model';

@Component({
  selector: 'app-challenge-card',
  imports: [RouterLink],
  templateUrl: './challenge-card.html',
  styleUrl: './challenge-card.scss',
})
export class ChallengeCard {
  readonly challenge = input.required<ChallengeDescriptor>();
  readonly index = input.required<number>();
}
