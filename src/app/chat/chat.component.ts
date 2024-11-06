import { EncryptionService } from './../encryption.service';
import { ChatService } from './chat.service';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Chat } from './chat.model';
import { WebSocketService } from '../web-socket/web-socket.service';
import { ContentType, Message } from '../message/message.model';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatListModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  newMessage: string = '';
  activeChat: Chat | null = null;
  chats: Chat[] = [];
  filteredChats: Chat[] = [];
  users: { id: string, name: string }[] = [];
  filteredUsers: { id: string, name: string }[] = [];
  searchTerm: string = '';
  showUserSearchResults: boolean = false;
  userId: string = '';
  private webSocketSubscription: Subscription | null = null;

  constructor(
    private chatService: ChatService,
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private encryptionService: EncryptionService,
  ) {}

  ngOnInit() {
    this.getUserId();
    this.loadUsers();
    this.loadChats();
  }

  ngOnDestroy() {
    this.cleanupWebSocket();
  }

  private setupWebSocketListener() {
    this.cleanupWebSocket();

    if (this.activeChat) {
      this.webSocketSubscription = this.webSocketService.subscribeToChatRoom(this.activeChat.id).subscribe((messages: Message[]) => {
        if (messages.length > 0) {
          const newMessage = messages[messages.length - 1];
          this.updateChatWithNewMessage(newMessage);
          this.scrollToBottom();
        }
      });
    }
  }

  private cleanupWebSocket() {
    if (this.webSocketSubscription) {
      this.webSocketSubscription.unsubscribe();
      this.webSocketSubscription = null;
    }
  }

  private loadUsers() {
    this.chatService.getUsers().subscribe(
      (users) => (this.users = users),
      (error) => console.log('Failed to load users:', error)
    );
  }

  private getUserId() {
    this.authService.isLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.userId = localStorage.getItem('userId') || '';
      } else {
        console.error('User is not logged in.');
      }
    });
  }

  getUserNameById(userId: string): string {
    const user = this.users.find(user => user.id === userId);
    return user ? user.name : 'Unknown User';
  }

  loadChats() {
    if (!this.userId) return;

    this.chatService.getChatRoomsForUser(this.userId).subscribe(
      (chats) => {
        this.chats = chats.map(chat => {
          this.chatService.getMessages(chat.id).subscribe((messages) => {
            chat.messages = messages.map(msg => {
              msg.text = this.encryptionService.decrypt(msg.text);
              return msg;
            });
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            chat.lastMessage = lastMessage ? `${lastMessage.senderId === this.userId ? 'You' : this.getUserNameById(lastMessage.senderId)}: ${lastMessage.text}` : 'No messages yet';
          });
          return chat;
        });
        this.filteredChats = this.chats;
      },
      (error) => console.error('Failed to load chats:', error)
    );
  }

  filterChats() {
    const term = this.searchTerm.toLowerCase();
    this.filteredChats = this.chats.filter(chat =>
      (chat.name && chat.name.toLowerCase().includes(term)) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(term))
    );

    this.filteredUsers = this.users.filter(user => user.name.toLowerCase().includes(term));
    this.showUserSearchResults = this.filteredChats.length === 0 && this.filteredUsers.length > 0;
  }

  selectChat(chat: Chat) {
    this.setActiveChat(chat);
    this.loadMessages(chat);
    this.setupWebSocketListener();
  }

  startNewConversation(user: { id: string, name: string }) {
    if (!this.userId) {
      console.error('Current user ID is not available.');
      return;
    }

    this.chatService.createOrFetchChatWithUser(this.userId, user.id).subscribe(
      (chat) => {
        this.chats.push(chat);
        this.setActiveChat(chat);
        this.loadMessages(chat);
        this.filteredChats = this.chats;
        this.showUserSearchResults = false;
        this.setupWebSocketListener();
      },
      (error) => console.error('Failed to start conversation:', error)
    );
  }

  private loadMessages(chat: Chat) {
    this.chatService.getMessages(chat.id).subscribe(
      (messages) => {
        chat.messages = messages.map(msg => {
          msg.text = this.encryptionService.decrypt(msg.text);
          return msg;
        });
        this.setActiveChat(chat);
      },
      (error) => console.error('Failed to load messages:', error)
    );
  }

  determineContentType(content: string): ContentType {
    const imageUrlPattern = /\.(jpeg|jpg|gif|png)$/i;
    return imageUrlPattern.test(content) ? ContentType.IMAGE : ContentType.TEXT;
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.activeChat) return;

    const contentType = this.determineContentType(this.newMessage);
    const recipientId = this.activeChat.userTwoId;

    const encryptedMessage = this.encryptionService.encrypt(this.newMessage);

    const message: Message = {
      id: '',
      text: encryptedMessage,
      senderId: this.userId,
      recipientId: recipientId,
      chatRoomId: this.activeChat.id,
      timestamp: new Date(),
      contentType: contentType
    };

    this.webSocketService.sendMessage(message, this.activeChat.id);
    this.newMessage = '';
  }

  private updateChatWithNewMessage(message: Message) {
    if (this.activeChat && message.chatRoomId === this.activeChat.id) {
      message.text = this.encryptionService.decrypt(message.text);
      this.activeChat.messages.push(message);
      this.scrollToBottom();
    }

    const chatToUpdate = this.chats.find(chat => chat.id === message.chatRoomId);
    if (chatToUpdate) {
      const senderName = message.senderId === this.userId ? 'You' : this.getUserNameById(message.senderId);
      chatToUpdate.lastMessage = `${senderName}: ${message.text}`;
    }
  }

  private scrollToBottom(): void {
    if (this.chatContainer) {
      const container = this.chatContainer.nativeElement;
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 0);
    }
  }

  setActiveChat(chat: Chat) {
    this.activeChat = chat;
  }

  logout() {
    this.authService.logout();
    this.userId = '';
  }
}
