import { Message } from "../message/message.model";

export interface Chat {
  id: string;
  name: string;
  userOneId: string;
  userTwoId: string;
  lastMessage?: string;
  messages: Message[];
}
