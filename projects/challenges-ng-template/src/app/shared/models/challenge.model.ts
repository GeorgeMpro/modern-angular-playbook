export interface ChallengeDescriptor {
  id: string;
  title: string;
  focus: string;
  concepts: string[];
  route: string;
  state: 'Done' | 'WIP';
}
