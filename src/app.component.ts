import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UrgentModalComponent } from './components/urgent-modal/urgent-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UrgentModalComponent],
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent implements OnInit, OnDestroy {
  isUrgentModalOpen = signal(false);
  
  // Background/Visibility Logic
  private lastHiddenTime: number = 0;
  private readonly BACKGROUND_THRESHOLD = 5000; // 5 seconds in background triggers SOS on return (demo friendly)
  private visibilityHandler: any;

  ngOnInit() {
    this.setupVisibilityListener();
  }

  ngOnDestroy() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  private setupVisibilityListener() {
    this.visibilityHandler = () => {
      if (document.hidden) {
        // App went to background
        this.lastHiddenTime = Date.now();
      } else {
        // App returned to foreground
        const now = Date.now();
        if (this.lastHiddenTime > 0 && (now - this.lastHiddenTime > this.BACKGROUND_THRESHOLD)) {
          // If the user was away for a significant time, assume they might need help immediately
          this.openUrgentModal();
        }
        this.lastHiddenTime = 0;
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  openUrgentModal() {
    this.isUrgentModalOpen.set(true);
  }

  closeUrgentModal() {
    this.isUrgentModalOpen.set(false);
  }
}