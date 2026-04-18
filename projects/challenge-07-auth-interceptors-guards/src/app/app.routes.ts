import {Routes} from '@angular/router';
import {Home} from './components/home/home';
import {Register} from './components/register/register';
import {Login} from './components/login/login';
import {Admin} from './components/admin/admin';
import {Dashboard} from './components/dashboard/dashboard';
import {authGuard} from './guards/auth-guard';
import {Forbidden} from './components/forbidden/forbidden';
import {roleGuard} from './guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'home'
  },
  {
    path: 'register',
    component: Register,
    title: 'register',
  },
  {
    path: 'login',
    component: Login,
    title: 'login'
  },
  {
    path: 'admin',
    component: Admin,
    title: 'admin',
    canActivate: [
      authGuard,
      roleGuard('admin')
    ]
  },
  {
    path: 'dashboard',
    component: Dashboard,
    title: 'dashboard',
    canActivate: [authGuard]
  },
  {
    path: 'forbidden',
    component: Forbidden,
    title: 'forbidden',
  },
];
