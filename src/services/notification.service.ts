
import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'alert';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<AppNotification[]>([]);
  hasPermission = signal<boolean>(false);

  constructor() {
    this.checkPermission();
  }

  private checkPermission() {
    if ('Notification' in window) {
      this.hasPermission.set(Notification.permission === 'granted');
    }
  }

  requestPermission() {
    if (!('Notification' in window)) return;
    
    Notification.requestPermission().then((permission) => {
      this.hasPermission.set(permission === 'granted');
      if (permission === 'granted') {
        this.push('Notificações Ativadas', 'Agora você receberá alertas de mensagens e propostas.', 'success');
      }
    });
  }

  push(title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') {
    const newNote: AppNotification = {
      id: Date.now().toString() + Math.random().toString(),
      title,
      message,
      read: false,
      timestamp: Date.now(),
      type
    };

    this.notifications.update(list => [newNote, ...list]);

    // System Notification
    if (this.hasPermission() && document.hidden) {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico' // Default fallback
      });
    }

    // Audio Cue
    this.playNotificationSound();
  }

  markAsRead(id: string) {
    this.notifications.update(list => 
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markAllAsRead() {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  getUnreadCount() {
    return this.notifications().filter(n => !n.read).length;
  }

  private playNotificationSound() {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Ignore autoplay errors
    } catch (e) {}
  }
}
