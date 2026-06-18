import {Service} from '@angular/core';

import {User} from '../models/user.model';

@Service()
export class UserMock {
  readonly users: User[] = [
    {id: 1, name: 'Alice Johnson', role: 'Admin', status: 'active'},
    {id: 2, name: 'Bob Smith', role: 'Editor', status: 'inactive'},
    {id: 3, name: 'Carol White', role: 'Viewer', status: 'active'},
    {id: 4, name: 'David Brown', role: 'Editor', status: 'banned'},
    {id: 5, name: 'Eve Davis', role: 'Admin', status: 'active'},
    {id: 6, name: 'Frank Miller', role: 'Viewer', status: 'inactive'},
    {id: 7, name: 'Grace Wilson', role: 'Editor', status: 'active'},
    {id: 8, name: 'Henry Moore', role: 'Viewer', status: 'active'},
    {id: 9, name: 'Isla Taylor', role: 'Admin', status: 'banned'},
    {id: 10, name: 'Jack Anderson', role: 'Editor', status: 'inactive'},
  ];

  public getUsers(): User[] {
    return this.users;
  }
}
