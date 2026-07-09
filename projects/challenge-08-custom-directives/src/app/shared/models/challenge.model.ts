export type ChallengeState = 'Done' | 'WIP' | 'Planned';

export interface ChallengeDescriptor {
  title: string;
  focus: string;
  concepts: string[];
  route: string;
  state: ChallengeState;
}
