import { MatSnackBar } from '@angular/material/snack-bar';
import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    RouterOutlet,
    FormsModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router, private snackBar: MatSnackBar) {}

  async onLogin() {
    try {
      const response = await firstValueFrom(this.authService.login(this.username, this.password));

      if (response) {
        const { token, userId } = response;
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        this.router.navigate(['/chat']);
      } else {
        this.snackBar.open('Login failed: Invalid credentials.', 'Close', { duration: 4000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
      }

    } catch(error) {
      this.snackBar.open('Login failed. Please try again.', 'Close', { duration: 4000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
    }
  }
}
