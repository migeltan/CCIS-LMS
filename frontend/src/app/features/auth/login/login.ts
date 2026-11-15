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
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    MatCardModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService); 

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  // Make this async because signInWithEmail is a Promise
  protected async submit(): Promise<void> {
    if (this.form.invalid) return;

    const email = this.form.value.email?.toLowerCase() || '';
    const password = this.form.value.password || '';

    // 1. Call the service to log in (this sets the profile signal)
    await this.auth.signInWithEmail(email, password);

    // 2. Check the role 
    const role = this.auth.role();

    // 3. Route based on the role
    if (role === 'teacher') {
      this.router.navigate(['/courses']); 
    } else if (role === 'admin') {
      this.router.navigate(['/admin']);   
    } else {
      this.router.navigate(['/dashboard']); 
    }
  }

  protected async google(): Promise<void> {
    await this.auth.signInWithGoogle();
    this.router.navigate(['/dashboard']); // Google mock defaults to student
  }
}