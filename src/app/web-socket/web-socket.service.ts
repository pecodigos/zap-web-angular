import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { Client, IMessage, IStompSocket } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from '../message/message.model';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private stompClient: Client;
  private messageSubjects: { [chatRoomId: string]: BehaviorSubject<Message[]> } = {};
  private activeChatRooms: string[] = [];

  constructor() {
    this.stompClient = new Client({
      brokerURL: `${environment.webSocketUrl}`,
      connectHeaders: {},
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // WebSocket factory using SockJS for fallbacks
    this.stompClient.webSocketFactory = () => new SockJS(`${environment.chatUrl}`) as IStompSocket;

    // Connection callback
    this.stompClient.onConnect = () => {
      console.log('Connected to WebSocket server');
      this.resubscribeToActiveChats(); // Resubscribe if reconnected
    };

    // Error handling for connection issues
    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    // Activation of the STOMP client
    this.stompClient.activate();
  }

  subscribeToChatRoom(chatRoomId: string): Observable<Message[]> {
    if (!this.messageSubjects[chatRoomId]) {
      this.messageSubjects[chatRoomId] = new BehaviorSubject<Message[]>([]); // Initialize with an empty array
      this.activeChatRooms.push(chatRoomId);

      // Subscribe to the chat room topic
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
      console.error("Error parsing message", error);
    }
  }

  sendMessage(message: Message, chatRoomId: string) {
    console.log(`Sending message to chat room ${chatRoomId}:`, message); // Log the message being sent
    this.stompClient.publish({
      destination: `/app/chat-room/${chatRoomId}/sendMessage`,
      body: JSON.stringify(message),
    });
  }

  private resubscribeToActiveChats() {
    // Re-subscribe to all previously active chat rooms after reconnecting
    this.activeChatRooms.forEach(chatRoomId => {
      this.subscribeToChatRoom(chatRoomId);
    });
  }
}
