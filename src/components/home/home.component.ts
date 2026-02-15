import { Component, inject, signal, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 relative overflow-hidden transition-all duration-1000">
      
      <!-- Custom Background Image -->
      <div class="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
           [style.background-image]="customBackground() ? 'url(' + customBackground() + ')' : ''"
           [class.opacity-40]="!customBackground()"
           [class.opacity-100]="customBackground()"
           [class.grayscale]="peaceMode() && !customBackground()">
           @if(!customBackground()) {
             <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900"></div>
           } @else {
             <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
           }
      </div>

      <!-- Controls (Top Right) -->
      <div class="absolute top-6 right-6 z-50 flex flex-col items-end gap-3">
        
        <!-- Wallpaper Toggle -->
        <label class="cursor-pointer bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg">
           <i class="fas fa-image text-purple-300"></i>
           <span class="hidden md:inline">Alterar Fundo</span>
           <input type="file" accept="image/*" (change)="handleBackgroundUpload($event)" class="hidden">
        </label>

        <!-- Toggle Peace Mode -->
        <button (click)="togglePeaceMode()" 
          class="bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg">
          @if (peaceMode()) {
            <i class="fas fa-sun text-yellow-300"></i> Modo Normal
          } @else {
            <i class="fas fa-leaf text-green-300"></i> Modo Paz
          }
        </button>

        <!-- Audio Player (System Audio) -->
        @if (showAudioPlayer()) {
          <div class="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-xl transition-all w-60 animate-fade-in flex items-center gap-2">
             <button (click)="toggleAudio()" class="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors flex-shrink-0">
                <i class="fas" [class.fa-play]="!isPlaying()" [class.fa-pause]="isPlaying()" [class.text-green-400]="isPlaying()"></i>
             </button>
             
             <div class="flex-1 overflow-hidden">
                <p class="text-[10px] text-gray-300 truncate">Sons da Natureza</p>
                <div class="h-1 bg-white/10 rounded-full w-full mt-1 overflow-hidden">
                   <div class="h-full bg-green-400 transition-all duration-300" [style.width.%]="isPlaying() ? 100 : 0"></div>
                </div>
             </div>

             <button (click)="closeAudioPlayer()" class="text-gray-500 hover:text-white px-2">
               <i class="fas fa-times text-xs"></i>
             </button>

             <audio #audioPlayer [src]="audioUrl()" loop></audio>
          </div>
        }
      </div>

      <!-- Main Content -->
      <div class="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-20 transition-all duration-1000"
           [class.translate-y-4]="peaceMode()">
        
        <!-- Branding Side (Left) -->
        <div class="text-center md:text-left flex-1 animate-fade-in-up">
          <div class="mb-6 inline-flex justify-center md:justify-start">
            <div class="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl relative transition-transform duration-700 hover:scale-105">
              <i class="fas fa-brain text-4xl text-purple-300 absolute opacity-50 blur-[2px]"></i>
              <i class="fas fa-hands-helping text-4xl text-white relative z-10"></i>
            </div>
          </div>
          
          <h1 class="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg text-white">
            AJUDE-IA
          </h1>
          <p class="text-lg md:text-xl text-gray-200 mb-8 font-light leading-relaxed drop-shadow-md max-w-lg mx-auto md:mx-0">
            Segurança, Rapidez e Inteligência.
            <br/>
            A plataforma que conecta quem precisa a quem resolve.
          </p>

          <div class="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-400 font-mono">
             <span class="flex items-center gap-2"><i class="fas fa-lock text-green-400"></i> Criptografia Ponta-a-Ponta</span>
             <span class="hidden md:inline">•</span>
             <span class="flex items-center gap-2"><i class="fas fa-bolt text-yellow-400"></i> Triagem via IA</span>
          </div>
        </div>

        <!-- Auth Form Side (Right) -->
        <div class="flex-1 w-full max-w-md">
          <div class="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-500">
            
            <!-- Selection Mode (Start) -->
            @if (!selectedRole()) {
              <div class="space-y-6 animate-fade-in">
                <h2 class="text-2xl font-bold text-center mb-6 text-white">Bem-vindo(a)</h2>
                
                <button (click)="selectRole('user')" 
                  class="w-full group bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 p-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg flex items-center gap-4 border border-white/5">
                  <div class="bg-indigo-600 p-3 rounded-lg shadow-inner">
                    <i class="fas fa-search-location text-xl text-white"></i>
                  </div>
                  <div class="text-left">
                    <h3 class="font-bold text-lg text-white">Preciso de Ajuda</h3>
                    <p class="text-xs text-gray-300">Encontrar serviços</p>
                  </div>
                  <i class="fas fa-arrow-right ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400"></i>
                </button>

                <button (click)="selectRole('professional')"
                  class="w-full group bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 p-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg flex items-center gap-4 border border-white/5">
                  <div class="bg-purple-600 p-3 rounded-lg shadow-inner">
                    <i class="fas fa-briefcase text-xl text-white"></i>
                  </div>
                  <div class="text-left">
                    <h3 class="font-bold text-lg text-white">Sou Profissional</h3>
                    <p class="text-xs text-gray-300">Oferecer serviços</p>
                  </div>
                  <i class="fas fa-arrow-right ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-purple-400"></i>
                </button>

                <div class="text-center pt-4 border-t border-white/10">
                  <button (click)="toggleLoginMode(true)" class="text-sm text-gray-300 hover:text-white transition-colors">
                    Já possui cadastro? <span class="text-blue-300 font-bold">Fazer Login</span>
                  </button>
                </div>
              </div>
            } @else {
              <!-- Auth Forms (Login / Register) -->
              <div class="animate-fade-in">
                <div class="flex justify-between items-center mb-6">
                   <button (click)="backToSelection()" class="text-gray-400 hover:text-white text-sm flex items-center gap-2">
                    <i class="fas fa-arrow-left"></i> Voltar
                   </button>
                   <span class="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-300">
                      {{ selectedRole() === 'user' ? 'CLIENTE' : 'PROFISSIONAL' }}
                   </span>
                </div>

                <h2 class="text-2xl font-bold mb-1 text-white">
                  {{ isLoginMode() ? 'Login Seguro' : 'Criar Conta' }}
                </h2>
                <p class="text-gray-400 text-sm mb-6">
                  {{ isLoginMode() ? 'Insira suas credenciais para acessar.' : 'Preencha os dados abaixo.' }}
                </p>

                <form (submit)="onSubmit($event)" class="space-y-4">
                  @if (!isLoginMode()) {
                    <div class="space-y-1">
                      <input type="text" [(ngModel)]="formData.name" name="name" required
                             class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                             placeholder="Nome Completo">
                    </div>

                    @if (selectedRole() === 'professional') {
                      <div class="space-y-1">
                        <input type="text" [(ngModel)]="formData.profession" name="profession" required
                               class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                               placeholder="Sua Profissão">
                      </div>
                    }

                    <div class="space-y-1">
                       <input type="tel" [(ngModel)]="formData.phone" name="phone" required
                              class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                              placeholder="Celular / WhatsApp">
                    </div>
                  }

                  <div class="space-y-1">
                    <input type="email" [(ngModel)]="formData.email" name="email" required
                           class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                           placeholder="E-mail">
                  </div>

                  <div class="space-y-1">
                    <input type="password" [(ngModel)]="formData.password" name="password" required
                           class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                           placeholder="Senha">
                  </div>

                  @if (errorMessage()) {
                    <div class="bg-red-900/40 border border-red-500/30 text-red-200 text-xs p-3 rounded-lg flex items-center gap-2">
                      <i class="fas fa-exclamation-triangle"></i> {{ errorMessage() }}
                    </div>
                  }

                  <button type="submit" [disabled]="isLoading()"
                    class="w-full bg-white text-gray-900 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-all shadow-lg mt-4 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    @if (isLoading()) {
                      <i class="fas fa-circle-notch fa-spin"></i>
                    } @else {
                      {{ isLoginMode() ? 'Entrar no Sistema' : 'Concluir Cadastro' }}
                    }
                  </button>
                </form>

                <div class="mt-6 text-center text-sm border-t border-white/5 pt-4">
                  <button (click)="toggleLoginMode(!isLoginMode())" class="text-blue-300 hover:text-white transition-colors">
                    {{ isLoginMode() ? 'Não possui conta? Cadastre-se' : 'Já tem conta? Entrar' }}
                  </button>
                </div>

                <!-- Minimal Social Login -->
                <div class="flex justify-center gap-4 mt-6">
                   <button (click)="onSocialLogin('Google')" class="text-gray-500 hover:text-white transition-colors"><i class="fab fa-google text-lg"></i></button>
                   <button (click)="onSocialLogin('Apple')" class="text-gray-500 hover:text-white transition-colors"><i class="fab fa-apple text-lg"></i></button>
                </div>
              </div>
            }

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class HomeComponent implements OnInit {
  private auth = inject(AuthService);
  private router: Router = inject(Router);

  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

  // State
  selectedRole = signal<'user' | 'professional' | null>(null);
  isLoginMode = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  
  // Customization State
  peaceMode = signal(false);
  showAudioPlayer = signal(true);
  customBackground = signal<string | null>(null);
  
  // Audio
  audioUrl = signal<string>('https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg');
  isPlaying = signal(false);

  // Form Data
  formData = {
    name: '',
    email: '',
    password: '',
    profession: '',
    phone: ''
  };

  constructor() {
    // If already logged in, redirect
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit() {
    // Load saved background
    const savedBg = localStorage.getItem('ajude_custom_bg');
    if (savedBg) {
      this.customBackground.set(savedBg);
    }
  }

  handleBackgroundUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.customBackground.set(result);
        try {
          // Save to local storage for persistence (beware size limits)
          localStorage.setItem('ajude_custom_bg', result);
        } catch (e) {
          console.warn('Image too large to save persistently, but will work for session.');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  togglePeaceMode() {
    this.peaceMode.update(v => !v);
  }

  toggleAudio() {
    if (!this.audioPlayer) return;
    
    if (this.isPlaying()) {
      this.audioPlayer.nativeElement.pause();
    } else {
      this.audioPlayer.nativeElement.play().catch(e => console.error("Audio block:", e));
    }
    this.isPlaying.update(v => !v);
  }

  closeAudioPlayer() {
    if (this.audioPlayer && this.isPlaying()) {
       this.audioPlayer.nativeElement.pause();
       this.isPlaying.set(false);
    }
    this.showAudioPlayer.set(false);
  }

  selectRole(role: 'user' | 'professional') {
    this.selectedRole.set(role);
    this.isLoginMode.set(false); // Default to register when picking a role first time
    this.errorMessage.set('');
  }

  toggleLoginMode(isLogin: boolean) {
    this.isLoginMode.set(isLogin);
    if (isLogin && !this.selectedRole()) {
      this.selectedRole.set('user'); // Default to show form
    }
    this.errorMessage.set('');
  }

  backToSelection() {
    this.selectedRole.set(null);
    this.formData = { name: '', email: '', password: '', profession: '', phone: '' };
    this.errorMessage.set('');
  }

  async onSocialLogin(provider: string) {
    this.isLoading.set(true);
    try {
      const role = this.selectedRole() || 'user';
      await this.auth.socialLogin(provider, role);
      this.router.navigate(['/dashboard']);
    } catch(e) {
      this.errorMessage.set('Erro no login social. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      if (this.isLoginMode()) {
        await this.auth.login(this.formData.email, this.formData.password);
      } else {
        await this.auth.register({
          name: this.formData.name,
          email: this.formData.email,
          password: this.formData.password,
          role: this.selectedRole()!,
          profession: this.formData.profession,
          phone: this.formData.phone
        });
      }
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error.message || error.toString());
    } finally {
      this.isLoading.set(false);
    }
  }
}