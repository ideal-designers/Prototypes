import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'fvdr-login',
  standalone: true,
  imports: [NgIf, FormsModule],
  template: `
    <div class="login">
      <div class="card">
        <div class="logo">FVDR</div>
        <h1 class="title">Prototypes</h1>
        <p class="subtitle">Enter the access password to continue</p>

        <form (ngSubmit)="submit()" class="form">
          <input
            class="input"
            [class.input--error]="error"
            type="password"
            placeholder="Password"
            [(ngModel)]="password"
            name="password"
            autofocus
            autocomplete="current-password"
          />
          <p *ngIf="error" class="error">Incorrect password</p>
          <button class="btn" type="submit" [disabled]="!password">
            Enter
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .login {
      min-height: 100vh;
      background: #0B1410;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: 'Open Sans', sans-serif;
    }

    .card {
      width: 360px;
      background: #101A16;
      border: 1px solid #1e2e28;
      border-radius: 16px;
      padding: 40px 36px;
      text-align: center;
      animation: slideUp 0.2s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(12px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    .logo {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: var(--color-interactive-primary);
      background: rgba(44,156,116,.12);
      border: 1px solid rgba(44,156,116,.25);
      border-radius: 6px;
      padding: 4px 10px;
      margin-bottom: 20px;
    }

    .title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #e8f5f0;
      margin: 0 0 8px;
    }

    .subtitle {
      font-size: 0.875rem;
      color: #9bbfb0;
      margin: 0 0 28px;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .input {
      height: 44px;
      padding: 0 14px;
      background: #0B1410;
      border: 1px solid #1e2e28;
      border-radius: 8px;
      color: #e8f5f0;
      font-size: 1rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s;
      text-align: center;
      letter-spacing: 0.15em;
    }
    .input:focus { border-color: var(--color-interactive-primary); }
    .input::placeholder { letter-spacing: 0; color: #3a5a50; }
    .input--error { border-color: var(--color-danger); }

    .error {
      font-size: 0.8rem;
      color: var(--color-danger);
      margin: 0;
    }

    .btn {
      height: 44px;
      background: var(--color-interactive-primary);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn:hover:not(:disabled) { background: #3FB67D; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `],
})
export class LoginComponent {
  password = '';
  error = false;

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    if (this.auth.login(this.password)) {
      this.router.navigate(['/']);
    } else {
      this.error = true;
      this.password = '';
    }
  }
}
