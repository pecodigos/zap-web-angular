import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chat } from './chat.model';
import { Message } from '../message/message.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatApiUrl = `${environment.apiUrl}/api/chat`;
  private messageApiUrl = `${environment.apiUrl}/api/messages`;

  constructor(private http: HttpClient) {}

  // Get all chat rooms
  getChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.chatApiUrl}/`);
  }

  // Get messages for a specific chat room by ID
  getMessages(chatId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.messageApiUrl}/${chatId}`);
  }

  getChatRoomsForUser(userId: string): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.chatApiUrl}/user/${userId}`);
  }

  // Create or fetch chat with a user
  createOrFetchChatWithUser(userOneId: string, userTwoId: string): Observable<Chat> {
    const payload = { userOneId, userTwoId };

    return this.http.post<Chat>(`${this.chatApiUrl}/create-or-fetch`, payload);
  }

  // Get all users
  getUsers(): Observable<{ id: string, name: string }[]> {
    return this.http.get<{ id: string, name: string }[]>(`${environment.apiUrl}/api/users/`);
  }
}
