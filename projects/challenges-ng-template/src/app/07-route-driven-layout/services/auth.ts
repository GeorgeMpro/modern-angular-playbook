import { Service, signal} from '@angular/core';


@Service()
export class Auth {


  private readonly _isLoggedIn = signal(false);
  isLoggedIn = this._isLoggedIn.asReadonly();

  public login(): void {
    this._isLoggedIn.set(true);
  }

  public logout(): void {
    this._isLoggedIn.set(false);
  }
}
