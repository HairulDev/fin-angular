
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import axios from 'axios';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/env';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './index.page.html',
})
export default class LoginComponent {
  loginForm: FormGroup;
  loginError = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginError = '';
    const { username, password } = this.loginForm.value;

    try {
      const response = await axios.post(`${environment.apiUrl}/api/account/login`, {
        username,
        password
      });
      localStorage.setItem('token', response.data.token)

    const userObj = {
      userName: response.data.userName,
      email: response.data.email
    }
    localStorage.setItem('user', JSON.stringify(userObj))
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Login failed', error);
      this.loginError = 'Invalid username or password.';
    }
  }
}