import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-urgent-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-t-8 border-red-600">
          
          <!-- Header -->
          <div class="bg-red-50 p-6 border-b border-red-100 flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-bold text-red-700 flex items-center gap-2">
                <i class="fas fa-ambulance"></i> Ajuda Urgente
              </h2>
              <p class="text-red-600 mt-1">Selecione o tipo de emergência.</p>
            </div>
            <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            
            @if (mode() === 'select') {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button (click)="selectMode('physical')" 
                  class="flex flex-col items-center justify-center p-6 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl transition-all hover:scale-105 group">
                  <i class="fas fa-heartbeat text-4xl text-red-500 mb-3 group-hover:animate-pulse"></i>
                  <span class="font-bold text-lg text-gray-800">Saúde Física</span>
                  <span class="text-xs text-center text-gray-500 mt-1">Hospitais, UPA, SAMU</span>
                </button>

                <button (click)="selectMode('mental')"
                  class="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-all hover:scale-105 group">
                  <i class="fas fa-brain text-4xl text-blue-500 mb-3"></i>
                  <span class="font-bold text-lg text-gray-800">Saúde Mental</span>
                  <span class="text-xs text-center text-gray-500 mt-1">Apoio, CVV, Terapia</span>
                </button>
              </div>
            }

            @if (mode() === 'physical') {
              <div class="space-y-4">
                <p class="text-gray-700 text-sm">
                  Em casos de risco de vida imediato, ligue <strong>192</strong> (SAMU) ou <strong>193</strong> (Bombeiros).
                </p>
                <div class="grid gap-3">
                  <a href="https://www.google.com/maps/search/hospital+emergencia+proximo" target="_blank"
                     class="flex items-center justify-center gap-3 w-full p-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-md">
                    <i class="fas fa-map-marker-alt"></i>
                    Localizar Hospital Mais Próximo (GPS)
                  </a>
                  <a href="https://www.google.com/maps/search/posto+de+saude+proximo" target="_blank"
                     class="flex items-center justify-center gap-3 w-full p-4 bg-white border-2 border-red-600 text-red-600 font-bold rounded-lg hover:bg-red-50 transition">
                    <i class="fas fa-clinic-medical"></i>
                    Localizar Posto de Saúde
                  </a>
                </div>
                <button (click)="reset()" class="text-sm text-gray-500 hover:underline w-full text-center mt-2">Voltar</button>
              </div>
            }

            @if (mode() === 'mental') {
              <div class="space-y-4">
                @if (isLoading()) {
                   <div class="flex flex-col items-center justify-center py-4 text-blue-600">
                     <i class="fas fa-circle-notch fa-spin text-2xl"></i>
                     <p class="mt-2 text-sm">O Assistente está gerando uma mensagem de apoio...</p>
                   </div>
                } @else {
                   @if (advice()) {
                     <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 text-gray-700 italic">
                       "{{ advice() }}"
                     </div>
                   }
                }

                <p class="text-gray-700 text-sm">
                  Você não está sozinho. O CVV (Centro de Valorização da Vida) atende pelo número <strong>188</strong>.
                </p>
                
                <div class="grid gap-3">
                   <a href="tel:188"
                     class="flex items-center justify-center gap-3 w-full p-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md">
                    <i class="fas fa-phone-alt"></i>
                    Ligar para 188 (Gratuito)
                  </a>
                  <a href="https://www.google.com/maps/search/caps+saude+mental+proximo" target="_blank"
                     class="flex items-center justify-center gap-3 w-full p-4 bg-white border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition">
                    <i class="fas fa-map-marked-alt"></i>
                    Encontrar CAPS Próximo
                  </a>
                </div>
                 <button (click)="reset()" class="text-sm text-gray-500 hover:underline w-full text-center mt-2">Voltar</button>
              </div>
            }

          </div>
          
          <div class="bg-gray-50 p-3 text-center text-xs text-gray-400">
             Ajuda Mútua • Emergência
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class UrgentModalComponent {
  isOpen = input<boolean>(false);
  close = output<void>();

  mode = signal<'select' | 'physical' | 'mental'>('select');
  advice = signal<string>('');
  isLoading = signal<boolean>(false);

  private geminiService = inject(GeminiService);

  async selectMode(m: 'physical' | 'mental') {
    this.mode.set(m);
    if (m === 'mental') {
      this.isLoading.set(true);
      // Generate a quick comforting message
      const msg = await this.geminiService.getHealthAdvice("Estou sentindo muita ansiedade e preciso de ajuda mental agora.");
      this.advice.set(msg);
      this.isLoading.set(false);
    }
  }

  reset() {
    this.mode.set('select');
    this.advice.set('');
  }

  closeModal() {
    this.close.emit();
    this.reset();
  }
}