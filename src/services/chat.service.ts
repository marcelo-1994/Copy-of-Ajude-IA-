
import { Injectable, signal } from '@angular/core';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly STORAGE_KEY = 'ajude_chat_messages';
  
  // Signal to hold messages for the current active conversation
  currentMessages = signal<Message[]>([]);

  constructor() {
    // Listen for storage changes to update chat in real-time across tabs/windows
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY) {
        // We don't know who the current user is watching here easily without context,
        // but we can trigger a refresh if the component using this service calls loadConversation again.
        // Or simpler: verify if the change affects the currently loaded conversation in the component.
        // For this simple service, we will just re-emit the current state if we have a way to know the active filter.
        // A better approach for this simplified architecture:
        // Components should rely on an effect that pulls this signal, but the signal needs to update.
        // Since we can't know the IDs here easily without storing state, we'll implement a 'reload' trigger.
      }
    });
  }

  /**
   * Loads messages between two specific users
   */
  loadConversation(user1Id: string, user2Id: string) {
    const allMessages = this.getAllMessages();
    const conversation = allMessages.filter(m => 
      (m.senderId === user1Id && m.receiverId === user2Id) ||
      (m.senderId === user2Id && m.receiverId === user1Id)
    ).sort((a, b) => a.timestamp - b.timestamp);
    
    this.currentMessages.set(conversation);
  }

  /**
   * Sends a new message and updates the state
   */
  sendMessage(senderId: string, receiverId: string, text: string) {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId,
      receiverId,
      text,
      timestamp: Date.now()
    };

    const allMessages = this.getAllMessages();
    allMessages.push(newMessage);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMessages));

    // Update the local signal immediately
    this.currentMessages.update(msgs => [...msgs, newMessage]);
  }

  private getAllMessages(): Message[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}
