import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://api.zapweb.shop/api/auth';
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient, private router: Router) { }

  login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string, userId: string }>(`${this.apiUrl}/login`, { username, password }, { withCredentials: true })
      .pipe(
        tap((response: { token: string, userId: string }) => {
          this.setToken(response.token);
          localStorage.setItem('userId', response.userId);
        })
      );
  }

  register(name: string, username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { name, username, email, password });
  }

  logout(): void {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    this.loggedIn.next(false);
    this.router.navigate(['/']);
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  hasToken(): boolean {
    return !!localStorage.getItem('userToken');
  }

  setToken(token: string): void {
    localStorage.setItem('userToken', token);
    this.loggedIn.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
