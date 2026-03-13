import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly KEY = 'proto_auth';

  isAuthenticated(): boolean {
    if (!environment.password) return true; // no password configured → open
    return sessionStorage.getItem(this.KEY) === '1';
  }

  login(password: string): boolean {
    if (password === environment.password) {
      sessionStorage.setItem(this.KEY, '1');
      return true;
    }
    return false;
  }
}
