import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ChallengeDescriptor} from '../../models/challenge.model';

@Component({
  selector: 'app-challenge-card',
  imports: [RouterLink],
  templateUrl: './challenge-card.html',
  styleUrl: './challenge-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeCardComponent {
  readonly challenge = input.required<ChallengeDescriptor>();
}
