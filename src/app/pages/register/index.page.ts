
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import axios from 'axios';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/env';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './index.page.html',
})
export default class RegisterComponent {
  registerForm: FormGroup;
  registerError = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  async register() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.registerError = '';
    const { username, email, password } = this.registerForm.value;

    try {
      await axios.post(`${environment.apiUrl}/api/account/register`, {
        username,
        email,
        password
      });
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Registration failed', error);
      this.registerError = 'Registration failed. Please try again.';
    }
  }
}
