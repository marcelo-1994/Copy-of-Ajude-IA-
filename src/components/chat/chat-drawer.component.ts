
import { Component, input, output, inject, effect, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { User } from '../../services/auth.service';

@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div (click)="closeChat()" class="fixed inset-0 bg-black/50 z-40 transition-opacity animate-fade-in"></div>

      <!-- Drawer -->
      <div class="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform animate-slide-in flex flex-col">
        
        <!-- Header -->
        <div class="p-4 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between shadow-md">
          <div class="flex items-center gap-3">
            <div class="relative">
              <img [src]="otherUser()?.avatar" class="w-10 h-10 rounded-full bg-white/10 object-cover border border-white/30">
              <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-indigo-800 rounded-full"></div>
            </div>
            <div>
              <h3 class="font-bold text-sm">{{ otherUser()?.name }}</h3>
              <p class="text-xs text-indigo-200">{{ otherUser()?.profession || 'Usuário' }}</p>
            </div>
          </div>
          <button (click)="closeChat()" class="text-white/70 hover:text-white transition-colors p-2">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Messages Area -->
        <div #scrollContainer class="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          
          @if (chatService.currentMessages().length === 0) {
            <div class="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
              <i class="far fa-comments text-4xl mb-2 opacity-30"></i>
              <p>Inicie a conversa com {{ otherUser()?.name }}</p>
            </div>
          }

          @for (msg of chatService.currentMessages(); track msg.id) {
            <div class="flex flex-col" [class.items-end]="isMe(msg)" [class.items-start]="!isMe(msg)">
              <div class="max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm relative group animate-fade-in"
                   [class.bg-purple-600]="isMe(msg)"
                   [class.text-white]="isMe(msg)"
                   [class.rounded-tr-none]="isMe(msg)"
                   [class.bg-white]="!isMe(msg)"
                   [class.text-gray-800]="!isMe(msg)"
                   [class.rounded-tl-none]="!isMe(msg)"
                   [class.border]="!isMe(msg)"
                   [class.border-gray-200]="!isMe(msg)">
                {{ msg.text }}
                <span class="text-[10px] opacity-70 block text-right mt-1 font-mono">
                  {{ msg.timestamp | date:'HH:mm' }}
                </span>
              </div>
            </div>
          }
        </div>

        <!-- Input Area -->
        <div class="p-4 bg-white border-t border-gray-100">
          <form (submit)="send($event)" class="flex gap-2">
            <input 
              [(ngModel)]="newMessage" 
              name="message"
              type="text" 
              autocomplete="off"
              placeholder="Digite sua mensagem..." 
              class="flex-1 bg-gray-100 text-gray-800 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none focus:bg-white transition-all">
            <button type="submit" [disabled]="!newMessage.trim()"
              class="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
              <i class="fas fa-paper-plane text-xs"></i>
            </button>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .animate-slide-in { animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class ChatDrawerComponent implements OnDestroy {
  isOpen = input.required<boolean>();
  currentUser = input.required<User>();
  otherUser = input.required<any>(); // Using 'any' for the dashboard item shape or User interface
  
  close = output<void>();

  chatService = inject(ChatService);
  newMessage = '';
  private pollInterval: any;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor() {
    // Load conversation when drawer opens or user changes
    effect(() => {
      if (this.isOpen() && this.currentUser() && this.otherUser()) {
        this.loadMessages();
        this.startPolling();
        this.scrollToBottom();
      } else {
        this.stopPolling();
      }
    });

    // Auto scroll when messages update locally
    effect(() => {
      const msgs = this.chatService.currentMessages();
      this.scrollToBottom();
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  startPolling() {
    this.stopPolling();
    // Simple polling to simulate real-time socket receiving
    this.pollInterval = setInterval(() => {
      if (this.isOpen()) {
        this.loadMessages();
      }
    }, 1000);
  }

  stopPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadMessages() {
    if(this.currentUser() && this.otherUser()) {
       this.chatService.loadConversation(this.currentUser().id, String(this.otherUser().id));
    }
  }

  isMe(msg: any): boolean {
    return msg.senderId === this.currentUser().id;
  }

  send(event: Event) {
    event.preventDefault();
    if (!this.newMessage.trim()) return;

    this.chatService.sendMessage(
      this.currentUser().id,
      String(this.otherUser().id),
      this.newMessage
    );
    this.newMessage = '';
    this.scrollToBottom();
  }

  closeChat() {
    this.stopPolling();
    this.close.emit();
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
