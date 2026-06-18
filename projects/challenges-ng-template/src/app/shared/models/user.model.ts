export type Status = 'active' | 'inactive' | 'banned';

export interface User {
  id: number;
  name: string;
  role: string;
  status: Status;
}
