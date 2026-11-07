import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async google() {
    await this.auth.signInWithGoogle();
    this.router.navigateByUrl('/dashboard');
  }

  async submit() {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    await this.auth.signInWithEmail(email, password);
    this.router.navigateByUrl('/dashboard');
  }
}