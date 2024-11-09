import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chat } from './chat.model';
import { Message } from '../message/message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'https://api.zapweb.shop/api'

  constructor(private http: HttpClient) {}

  getChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.baseUrl}/chats/`);
  }

  getMessages(chatId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/messages/${chatId}`);
  }

  getChatRoomsForUser(userId: string): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.baseUrl}/chats/user/${userId}`);
  }

  createOrFetchChatWithUser(userOneId: string, userTwoId: string): Observable<Chat> {
    const payload = { userOneId, userTwoId };

    return this.http.post<Chat>(`${this.baseUrl}/chats/create-or-fetch`, payload);
  }

  getUsers(): Observable<{ id: string, name: string }[]> {
    return this.http.get<{ id: string, name: string }[]>(`${this.baseUrl}/users/`);
  }
}
