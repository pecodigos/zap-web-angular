import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from '../message/message.model';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService implements OnDestroy {
  private stompClient: Client;
  private messageSubjects: { [chatRoomId: string]: BehaviorSubject<Message[]> } = {};
  private activeChatRooms: string[] = [];

  constructor() {
    const socketUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//api.zapweb.shop/chat`;

    this.stompClient = new Client({
      brokerURL: socketUrl,
      connectHeaders: {},
      debug: (str) => console.log(`STOMP Debug: ${str}`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      webSocketFactory: () => new WebSocket(socketUrl),
    });

    this.stompClient.onConnect = () => {
      console.log('Connected to WebSocket server');
      this.resubscribeToActiveChats();
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error:', frame.headers['message']);
      console.error('Additional details:', frame.body);
    };

    this.stompClient.onWebSocketError = (error) => {
      console.error('WebSocket connection error:', error);
    };

    this.stompClient.onWebSocketClose = () => {
      console.warn('WebSocket connection closed');
    };

    this.stompClient.activate();
  }

  subscribeToChatRoom(chatRoomId: string): Observable<Message[]> {
    if (!this.messageSubjects[chatRoomId]) {
      this.messageSubjects[chatRoomId] = new BehaviorSubject<Message[]>([]);
      if (!this.activeChatRooms.includes(chatRoomId)) {
        this.activeChatRooms.push(chatRoomId);
      }

      this.stompClient.subscribe(`/topic/chat-rooms/${chatRoomId}`, (message: IMessage) => {
        this.onMessageReceived(chatRoomId, message);
      });

      console.log(`Subscribed to chat room: ${chatRoomId}`);
    }

    return this.messageSubjects[chatRoomId].asObservable();
  }

  private onMessageReceived(chatRoomId: string, message: IMessage) {
    try {
      const msg: Message = JSON.parse(message.body);
      if (this.messageSubjects[chatRoomId]) {
        const messages = this.messageSubjects[chatRoomId].getValue();
        messages.push(msg);
        this.messageSubjects[chatRoomId].next(messages);
      }
    } catch (error) {
      console.error('Error parsing message:', error, 'Message body:', message.body);
    }
  }

  sendMessage(message: Message, chatRoomId: string) {
    console.log(`Sending message to chat room ${chatRoomId}:`, message);
    try {
      this.stompClient.publish({
        destination: `/app/chat-room/${chatRoomId}/sendMessage`,
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  private resubscribeToActiveChats() {
    this.activeChatRooms.forEach(chatRoomId => {
      this.subscribeToChatRoom(chatRoomId);
    });
  }

  disconnect() {
    if (this.stompClient.active) {
      this.stompClient.deactivate();
      console.log('WebSocket connection deactivated');
    }
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
