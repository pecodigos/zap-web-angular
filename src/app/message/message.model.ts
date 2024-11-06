export enum ContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE'
}

export interface Message {
  id: string;
  text: string;
  imagePath?: string;
  senderId: string;
  recipientId: string;
  chatRoomId: string;
  timestamp: Date;
  contentType: ContentType;
}

