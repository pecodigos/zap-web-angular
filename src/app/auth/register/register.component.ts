import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    FormsModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  name: string = '';
  username: string = '';
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router, private snackBar: MatSnackBar) {}

  async onRegister() {
    try {
      // Call the registration service method
      const response = await firstValueFrom(
        this.authService.register(this.name, this.username, this.email, this.password)
      );
      if (response) {
        this.router.navigate(['/login']);
      } else {
        this.snackBar.open('Registration failed: Fields not filled properly.', 'Close', { duration: 5000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
      }
    } catch (error) {
      this.snackBar.open('Registration failed. Please try again.', 'Close', { duration: 5000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
    }
  }
}
