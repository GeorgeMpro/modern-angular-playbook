export type ChallengeState = 'Done' | 'WIP' | 'Planned';

export interface ChallengeDescriptor {
  id: string;
  title: string;
  focus: string;
  concepts: string[];
  route: string;
  state: ChallengeState;
}
