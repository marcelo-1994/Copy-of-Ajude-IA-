
import { Component, inject, signal, computed, effect, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GeminiService } from '../../services/gemini.service';
import { ProfessionalsService, ProfessionalProfile } from '../../services/professionals.service';
import { NotificationService } from '../../services/notification.service';
import { FormsModule } from '@angular/forms';
import { ChatDrawerComponent } from '../chat/chat-drawer.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare var L: any; // Leaflet Declaration

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatDrawerComponent],
  template: `
    <div class="min-h-screen bg-[#F3F2EF] font-sans pb-10">
      
      <!-- Navbar (LinkedIn Style) -->
      <nav class="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 shadow-sm">
        <div class="max-w-7xl mx-auto h-14 flex items-center justify-between">
            <!-- Logo & Search -->
            <div class="flex items-center gap-4">
               <div class="flex items-center text-purple-700 font-bold text-2xl tracking-tight cursor-pointer" (click)="switchTab('services')">
                  <i class="fas fa-brain mr-1"></i> <span class="hidden md:inline">AJUDE-IA</span>
               </div>

               <!-- Search Bar (Visual Only) -->
               <div class="hidden md:flex items-center bg-blue-50 px-3 py-1.5 rounded-md w-64 transition-all focus-within:w-80 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-600/20 border border-transparent focus-within:border-purple-200">
                  <i class="fas fa-search text-gray-500 mr-2"></i>
                  <input type="text" placeholder="Pesquisar serviços..." class="bg-transparent border-none outline-none text-sm w-full placeholder-gray-500">
               </div>
            </div>

            <!-- Nav Links -->
            <div class="flex items-center gap-1 sm:gap-6 h-full">
               <button (click)="switchTab('services')" [class.border-b-2]="currentTab() === 'services'" [class.border-black]="currentTab() === 'services'" class="h-full flex flex-col items-center justify-center px-2 min-w-[60px] md:min-w-[80px] text-gray-500 hover:text-black transition-all relative group">
                  <i class="fas fa-home text-lg mb-0.5" [class.text-black]="currentTab() === 'services'"></i>
                  <span class="text-[10px] hidden md:block">Início</span>
                  @if (currentTab() !== 'services') {
                    <div class="absolute bottom-0 w-full h-0.5 bg-black scale-x-0 group-hover:scale-x-100 transition-transform"></div>
                  }
               </button>
               
               <button (click)="switchTab('communities')" [class.border-b-2]="currentTab() === 'communities'" [class.border-black]="currentTab() === 'communities'" class="h-full flex flex-col items-center justify-center px-2 min-w-[60px] md:min-w-[80px] text-gray-500 hover:text-black transition-all relative group">
                  <i class="fas fa-heart text-lg mb-0.5" [class.text-black]="currentTab() === 'communities'"></i>
                  <span class="text-[10px] hidden md:block">Favoritos</span>
               </button>

               <button (click)="switchTab('plans')" [class.border-b-2]="currentTab() === 'plans'" [class.border-black]="currentTab() === 'plans'" class="h-full flex flex-col items-center justify-center px-2 min-w-[60px] md:min-w-[80px] text-gray-500 hover:text-black transition-all relative group">
                  <i class="fas fa-briefcase text-lg mb-0.5" [class.text-black]="currentTab() === 'plans'"></i>
                  <span class="text-[10px] hidden md:block">Planos</span>
               </button>

               <!-- Notifications Bell -->
               <div class="relative h-full flex items-center">
                  <button (click)="toggleNotifications()" class="flex flex-col items-center justify-center px-2 min-w-[60px] text-gray-500 hover:text-black transition-all">
                    <div class="relative">
                      <i class="fas fa-bell text-lg mb-0.5"></i>
                      @if (notificationService.getUnreadCount() > 0) {
                        <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-3 h-3 flex items-center justify-center rounded-full animate-pulse">
                          {{ notificationService.getUnreadCount() }}
                        </span>
                      }
                    </div>
                    <span class="text-[10px] hidden md:block">Avisos</span>
                  </button>

                  <!-- Notifications Dropdown -->
                  @if (showNotifications()) {
                    <div class="absolute top-14 right-0 w-80 bg-white shadow-xl rounded-b-lg border border-gray-100 overflow-hidden z-50 animate-fade-in">
                       <div class="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                         <h4 class="text-sm font-bold text-gray-700">Notificações</h4>
                         <button (click)="notificationService.markAllAsRead()" class="text-xs text-blue-600 hover:underline">Limpar</button>
                       </div>
                       <div class="max-h-80 overflow-y-auto">
                         @if (notificationService.notifications().length === 0) {
                           <div class="p-6 text-center text-gray-400 text-sm">Nenhuma notificação recente.</div>
                         }
                         @for (note of notificationService.notifications(); track note.id) {
                           <div class="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors" [class.bg-blue-50]="!note.read">
                              <p class="text-xs font-bold text-gray-800">{{ note.title }}</p>
                              <p class="text-xs text-gray-600 mt-1">{{ note.message }}</p>
                              <span class="text-[10px] text-gray-400 mt-2 block">{{ note.timestamp | date:'shortTime' }}</span>
                           </div>
                         }
                       </div>
                    </div>
                  }
               </div>

               <div class="border-l border-gray-200 h-8 mx-2 hidden md:block"></div>

               <!-- Profile Dropdown Trigger -->
               <button (click)="toggleProfileMode()" class="flex flex-col items-center justify-center text-gray-500 hover:text-black px-2">
                  <img [src]="auth.currentUser()?.avatar || 'https://ui-avatars.com/api/?name=' + auth.currentUser()?.name" class="w-6 h-6 rounded-full object-cover">
                  <span class="text-[10px] hidden md:flex items-center gap-1">Eu <i class="fas fa-caret-down"></i></span>
               </button>
            </div>
        </div>
      </nav>

      <!-- Layout Container -->
      <div class="max-w-7xl mx-auto px-0 sm:px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
         
         <!-- Left Sidebar (Profile) -->
         <div class="hidden md:block md:col-span-3">
            <div class="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 sticky top-20">
               <!-- Banner -->
               <div class="h-14 bg-gradient-to-r from-gray-600 to-gray-800"></div>
               
               <!-- Profile Info -->
               <div class="px-4 pb-4 text-center relative border-b border-gray-100">
                  <div class="w-16 h-16 rounded-full border-2 border-white absolute -top-8 left-1/2 transform -translate-x-1/2 overflow-hidden shadow-sm bg-white cursor-pointer group" (click)="toggleProfileMode()">
                     <img [src]="auth.currentUser()?.avatar || 'https://ui-avatars.com/api/?name=' + auth.currentUser()?.name" class="w-full h-full object-cover group-hover:opacity-90 transition-opacity">
                  </div>
                  <div class="mt-10">
                     <h2 class="font-bold text-gray-900 hover:underline cursor-pointer" (click)="toggleProfileMode()">{{ auth.currentUser()?.name }}</h2>
                     <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ auth.currentUser()?.profession || 'Membro AJUDE-IA' }}</p>
                  </div>
               </div>

               <div class="py-4 px-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors" (click)="switchTab('communities')">
                  <div class="flex justify-between items-center text-xs font-medium text-gray-500">
                     <span>Profissionais Salvos</span>
                     <span class="text-blue-600 font-bold">{{ professionalsService.favorites().length }}</span>
                  </div>
               </div>
               
               <div class="p-4 hover:bg-gray-50 cursor-pointer transition-colors group" (click)="switchTab('plans')">
                  <div class="flex items-center gap-2">
                     <i class="fas fa-square text-amber-500 text-xs"></i>
                     <span class="text-xs font-bold text-gray-700 group-hover:text-blue-600 underline decoration-gray-300 group-hover:decoration-blue-600">Experimente Premium</span>
                  </div>
               </div>
               
               <button (click)="shareApp()" class="w-full text-left border-t border-gray-100 p-3 text-xs text-gray-500 font-bold flex items-center gap-2 hover:bg-gray-50 cursor-pointer hover:text-blue-600 transition-colors">
                  <i class="fas fa-share-alt text-gray-400"></i> Convidar Amigos
               </button>
            </div>
         </div>

         <!-- Main Feed (Center) -->
         <div class="col-span-1 md:col-span-6 space-y-4">
            
            @if (currentTab() === 'services' || currentTab() === 'communities') {
              
              @if (currentTab() === 'services' && showProfileEditor()) {
                  <!-- Profile Editor (Expanded) & Account Menu -->
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 animate-slide-down">
                     <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                        <h3 class="font-bold text-gray-800">Minha Conta</h3>
                        <button (click)="toggleProfileMode()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
                     </div>
                     
                     <div class="grid grid-cols-1 gap-4 mb-6">
                        <div class="grid grid-cols-2 gap-4">
                           <input [(ngModel)]="myProfile.profession" class="border p-2 rounded text-sm w-full" placeholder="Título Profissional">
                           <input [(ngModel)]="myProfile.location" class="border p-2 rounded text-sm w-full" placeholder="Localização">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                          <input [(ngModel)]="myProfile.minPrice" type="number" class="border p-2 rounded text-sm" placeholder="Valor Mínimo (R$)">
                          <select [(ngModel)]="myProfile.priceRate" class="border p-2 rounded text-sm bg-white">
                            <option value="hora">/ hora</option>
                            <option value="dia">/ dia</option>
                            <option value="visita">/ visita</option>
                            <option value="serviço">/ serviço</option>
                          </select>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                          <select [(ngModel)]="myProfile.availability" class="border p-2 rounded text-sm bg-white">
                             <option value="Imediata">Disponibilidade Imediata</option>
                             <option value="Agendamento">Apenas Agendamento</option>
                             <option value="Indisponível">Indisponível Agora</option>
                          </select>
                          <input [(ngModel)]="myProfile.whatsapp" class="border p-2 rounded text-sm" placeholder="WhatsApp (apenas números)">
                        </div>
                        <input [(ngModel)]="myProfile.videoUrl" class="border p-2 rounded text-sm" placeholder="URL Vídeo YouTube">
                        <textarea [(ngModel)]="myProfile.description" rows="3" class="border p-2 rounded text-sm" placeholder="Descreva seus serviços e diferenciais..."></textarea>
                        
                        <div class="flex justify-end">
                           <button (click)="saveProfile()" class="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition-colors w-full sm:w-auto">Salvar Dados</button>
                        </div>
                     </div>

                     <!-- Actions Section (Visible on Mobile) -->
                     <div class="border-t border-gray-100 pt-4">
                        <h4 class="font-bold text-gray-700 mb-2 text-sm">Ações da Conta</h4>
                        <button (click)="shareApp()" class="w-full bg-green-50 text-green-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100 transition-colors mb-2">
                           <i class="fas fa-share-alt"></i> Compartilhar Aplicativo
                        </button>
                        <button (click)="logout()" class="w-full bg-red-50 text-red-600 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                           <i class="fas fa-sign-out-alt"></i> Sair da Conta
                        </button>
                     </div>
                  </div>
              }

              <!-- AI Input Box (Only on Services Tab) -->
              @if (currentTab() === 'services') {
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                   <div class="flex gap-3 mb-3">
                      <img [src]="auth.currentUser()?.avatar || 'https://ui-avatars.com/api/?name=' + auth.currentUser()?.name" class="w-12 h-12 rounded-full object-cover">
                      <div class="flex-grow border border-gray-300 rounded-full hover:bg-gray-100 transition-colors cursor-text px-4 py-3 text-sm font-medium text-gray-500 flex items-center justify-between group" (click)="focusAiInput()">
                         <span class="group-hover:text-gray-600">{{ userProblem() || 'O que você precisa hoje? (IA)' }}</span>
                      </div>
                   </div>
                   
                   <!-- Expanded Input Area -->
                   @if(showAiInput() || userProblem()) {
                      <textarea 
                          #aiInput
                          [ngModel]="userProblem()"
                          (ngModelChange)="userProblem.set($event)"
                          rows="3" 
                          class="w-full p-2 text-sm border-none outline-none resize-none bg-transparent placeholder-gray-400" 
                          placeholder="Ex: Minha pia está vazando e preciso de um encanador urgente..."></textarea>
                   }
  
                   <div class="flex justify-between items-center pt-2">
                      <div class="flex gap-2 sm:gap-4">
                         <button class="flex items-center gap-2 text-gray-500 hover:bg-gray-100 px-2 py-1 rounded text-sm font-medium transition-colors"><i class="fas fa-image text-blue-500"></i> <span class="hidden sm:inline">Mídia</span></button>
                         <button class="flex items-center gap-2 text-gray-500 hover:bg-gray-100 px-2 py-1 rounded text-sm font-medium transition-colors"><i class="fas fa-calendar-alt text-amber-600"></i> <span class="hidden sm:inline">Agendar</span></button>
                      </div>
                      
                      <button (click)="analyzeProblem()" [disabled]="!userProblem()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-5 rounded-full text-sm disabled:opacity-50 transition-colors shadow-sm">
                         {{ isAnalyzing() ? 'Analisando...' : 'Publicar / Buscar' }}
                      </button>
                   </div>
  
                   <!-- Analysis Result Preview -->
                   @if (analysisResult()) {
                     <div class="mt-4 bg-blue-50 p-3 rounded-md text-sm text-blue-900 border border-blue-100 animate-fade-in">
                        <p class="font-semibold flex items-center gap-2"><i class="fas fa-robot text-blue-600"></i> Sugestão: {{ analysisResult()?.suggestedProfession }}</p>
                        <p class="mt-1 italic text-blue-800">"{{ analysisResult()?.advice }}"</p>
                        <div class="mt-2 flex gap-2">
                           @for(k of analysisResult()?.keywords; track k) {
                              <span class="text-xs bg-white px-2 py-0.5 rounded border border-blue-100 text-blue-600">#{{k}}</span>
                           }
                        </div>
                     </div>
                     <div class="flex justify-end mt-2">
                        <button (click)="clearAnalysis()" class="text-xs text-gray-500 hover:text-gray-700 underline">Limpar busca</button>
                     </div>
                   }
                </div>
              } @else {
                  <!-- Favorites Header -->
                  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex justify-between items-center animate-fade-in">
                      <div>
                        <h2 class="font-bold text-gray-800 text-lg">Meus Profissionais Favoritos</h2>
                        <p class="text-xs text-gray-500">Lista salva para acesso rápido.</p>
                      </div>
                      <i class="fas fa-heart text-red-500 text-2xl"></i>
                  </div>
                  @if (filteredItems().length === 0) {
                      <div class="text-center p-8 text-gray-400">
                          <i class="far fa-heart text-4xl mb-3"></i>
                          <p>Você ainda não favoritou ninguém.</p>
                      </div>
                  }
              }

              <!-- View Toggle & Sort (Only if we have items) -->
              @if (filteredItems().length > 0) {
                <div class="flex justify-between items-center px-1 py-1">
                   <div class="h-[1px] bg-gray-300 flex-grow mr-4 hidden sm:block"></div>
                   <div class="flex items-center gap-2">
                       <button (click)="setViewMode('list')" [class.text-black]="viewMode() === 'list'" [class.text-gray-400]="viewMode() !== 'list'" class="text-sm font-medium"><i class="fas fa-list"></i></button>
                       <button (click)="setViewMode('map')" [class.text-black]="viewMode() === 'map'" [class.text-gray-400]="viewMode() !== 'map'" class="text-sm font-medium"><i class="fas fa-map-marked-alt"></i></button>
                       <span class="text-xs text-gray-500 ml-2">Ordenar por: <span class="font-bold text-gray-800 cursor-pointer">Relevância <i class="fas fa-caret-down"></i></span></span>
                   </div>
                </div>
              }

              @if(viewMode() === 'map') {
                 <!-- Full Map View in Center Column -->
                 <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[500px] relative animate-fade-in">
                     <div id="map" class="w-full h-full z-0"></div>
                      @if (mapSelectedUser()) {
                        <div class="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-2xl z-[1000] animate-slide-up border border-gray-200">
                           <div class="flex justify-between items-start mb-2">
                             <div class="flex items-center gap-3">
                                <img [src]="mapSelectedUser().avatar" class="w-10 h-10 rounded-full object-cover">
                                <div>
                                   <h4 class="font-bold text-gray-800 text-sm">{{ mapSelectedUser().name }}</h4>
                                   <p class="text-xs text-gray-500">{{ mapSelectedUser().profession }}</p>
                                </div>
                             </div>
                             <button (click)="closeMapCard()" class="text-gray-400"><i class="fas fa-times"></i></button>
                           </div>
                           <div class="flex gap-2 mt-2">
                              <button (click)="openChat(mapSelectedUser())" class="flex-1 bg-blue-600 text-white text-xs font-bold py-1.5 rounded-full">Mensagem</button>
                              <button (click)="openOfferModal(mapSelectedUser())" class="flex-1 border border-blue-600 text-blue-600 text-xs font-bold py-1.5 rounded-full">Proposta</button>
                           </div>
                        </div>
                      }
                 </div>
              } @else {
                  <!-- Feed List -->
                  @for (item of filteredItems(); track item.id) {
                     <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-0 overflow-hidden mb-4 animate-fade-in">
                        
                        <!-- Header -->
                        <div class="p-4 flex gap-3 items-start">
                           <div class="relative">
                             <img [src]="item.avatar" class="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-90">
                             @if(item.availability === 'Imediata') {
                               <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" title="Disponível Agora"></div>
                             }
                           </div>
                           <div class="flex-grow">
                              <div class="flex justify-between items-start">
                                 <div>
                                    <h3 class="font-bold text-gray-900 text-sm hover:text-blue-600 hover:underline cursor-pointer transition-colors">{{ item.name }}</h3>
                                    <p class="text-xs text-gray-500">{{ item.profession }} • {{ item.location }}</p>
                                    <div class="flex flex-wrap items-center gap-2 mt-1">
                                       @if(item.verified) { <span class="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200"><i class="fas fa-check-circle text-blue-500"></i> Verificado</span> }
                                       @if(item.minPrice) { <span class="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">R$ {{item.minPrice}} / {{item.priceRate}}</span> }
                                    </div>
                                 </div>
                                 <button class="text-blue-600 font-semibold text-sm hover:bg-blue-50 px-3 py-1 rounded-full transition-colors flex items-center gap-1" (click)="openOfferModal(item)">
                                    <i class="fas fa-plus text-xs"></i> Contratar
                                 </button>
                              </div>
                           </div>
                        </div>

                        <!-- Content -->
                        <div class="px-4 pb-2">
                           <p class="text-sm text-gray-800 leading-relaxed">{{ item.description }}</p>
                           @if(item.videoUrl) {
                              <div class="mt-3 bg-gray-100 rounded-md p-2 flex items-center gap-3 cursor-pointer hover:bg-gray-200 transition-colors border border-gray-200" (click)="openVideo(item.videoUrl)">
                                 <div class="w-12 h-8 bg-black rounded flex items-center justify-center text-white"><i class="fas fa-play text-[10px]"></i></div>
                                 <span class="text-xs font-semibold text-gray-700">Apresentação em Vídeo</span>
                              </div>
                           }
                        </div>

                        <!-- Footer Actions -->
                        <div class="border-t border-gray-100 mt-2">
                           <div class="flex px-2 py-1">
                              <!-- Like / Favorite Button -->
                              <button (click)="toggleFavorite(item)" class="flex-1 py-3 hover:bg-gray-100 rounded-md font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors group"
                                      [class.text-red-600]="professionalsService.isFavorite(item.id)"
                                      [class.text-gray-500]="!professionalsService.isFavorite(item.id)">
                                 <i class="fas fa-heart text-lg" [class.fas]="professionalsService.isFavorite(item.id)" [class.far]="!professionalsService.isFavorite(item.id)"></i> 
                                 <span class="hidden sm:inline">{{ professionalsService.isFavorite(item.id) ? 'Salvo' : 'Salvar' }}</span>
                              </button>

                              <button (click)="openChat(item)" class="flex-1 py-3 hover:bg-gray-100 rounded-md text-gray-500 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors group">
                                 <i class="far fa-comment-dots text-lg group-hover:text-blue-600"></i> <span class="hidden sm:inline">Mensagem</span>
                              </button>
                              <button (click)="shareProfile(item)" class="flex-1 py-3 hover:bg-gray-100 rounded-md text-gray-500 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors group">
                                 <i class="fas fa-share text-lg group-hover:text-blue-600"></i> <span class="hidden sm:inline">Compartilhar</span>
                              </button>
                           </div>
                        </div>
                     </div>
                  }
              }
            
            } @else {
               <!-- Plans Content (Minimalist) -->
               <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                  <div class="bg-[#F8C77E] p-6 flex justify-between items-center">
                     <div>
                        <h3 class="font-bold text-amber-900 text-xl">Premium Career</h3>
                        <p class="text-amber-800/80 text-sm">Destaque-se na multidão.</p>
                     </div>
                     <i class="fas fa-gem text-4xl text-amber-900/20"></i>
                  </div>
                  <div class="p-6">
                     <ul class="space-y-3 mb-6 text-sm text-gray-600">
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> 4x mais visualizações de perfil</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Mensagens diretas ilimitadas</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Selo de Profissional Verificado</li>
                        <li class="flex items-center gap-2"><i class="fas fa-check text-green-500"></i> Notificações Prioritárias</li>
                     </ul>
                     <button (click)="notificationService.push('Plano Premium', 'Obrigado pelo interesse! Em breve disponível.', 'info')" class="bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold py-3 px-4 rounded-full w-full transition-colors shadow-sm">
                        Testar Grátis por 1 Mês
                     </button>
                     <p class="text-center text-xs text-gray-400 mt-4">Depois R$ 10,00/mês. Cancele quando quiser.</p>
                  </div>
               </div>
            }

         </div>

         <!-- Right Sidebar (News/Map) -->
         <div class="hidden md:block md:col-span-3 space-y-4">
            <!-- Map Mini View -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
               <div class="p-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 class="font-bold text-sm text-gray-700">Radar de Oportunidades</h3>
                  <i class="fas fa-info-circle text-gray-400 text-xs cursor-pointer" title="Profissionais próximos"></i>
               </div>
               <div class="h-40 bg-gray-100 relative group cursor-pointer" (click)="setViewMode('map')">
                  <!-- Static Map Image Placeholder or abstract pattern -->
                  <div class="absolute inset-0 bg-[url('https://maps.wikimedia.org/img/osm-intl,12,-23.55,-46.63,300x200.png')] bg-cover opacity-50 grayscale hover:grayscale-0 transition-all"></div>
                  
                  <div class="absolute inset-0 flex items-center justify-center">
                      <button class="bg-white hover:bg-gray-50 text-blue-600 font-bold text-xs px-4 py-2 rounded-full shadow-md border border-gray-200 transition-transform transform group-hover:scale-105">
                         Ver no Mapa
                      </button>
                  </div>
               </div>
            </div>

            <!-- News/Trending -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
               <div class="flex justify-between items-center mb-4">
                  <h3 class="font-bold text-sm text-gray-700">Ajude News</h3>
                  <i class="fas fa-info-circle text-gray-400 text-xs"></i>
               </div>
               <ul class="space-y-4">
                  <li class="cursor-pointer group">
                     <span class="block text-xs font-bold text-gray-800 group-hover:text-blue-600 group-hover:underline leading-tight">Mercado de serviços cresce 20% no Brasil</span>
                     <span class="block text-[10px] text-gray-400 mt-1">Há 2h • 1.209 leitores</span>
                  </li>
                  <li class="cursor-pointer group">
                     <span class="block text-xs font-bold text-gray-800 group-hover:text-blue-600 group-hover:underline leading-tight">Dicas essenciais para contratar encanadores</span>
                     <span class="block text-[10px] text-gray-400 mt-1">Há 5h • 845 leitores</span>
                  </li>
                  <li class="cursor-pointer group">
                     <span class="block text-xs font-bold text-gray-800 group-hover:text-blue-600 group-hover:underline leading-tight">IA revolucionando a triagem médica preventiva</span>
                     <span class="block text-[10px] text-gray-400 mt-1">Há 10h • 5.302 leitores</span>
                  </li>
               </ul>
            </div>

            <!-- Footer Links -->
            <div class="text-center px-4">
                <div class="mt-2 text-[11px] text-purple-700 font-bold flex items-center justify-center gap-1">
                   <i class="fas fa-brain text-xs"></i> AJUDE-IA Corporation © 2025
                </div>
            </div>
         </div>
      </div>

      <!-- Keep existing Modals -->
      @if (offerTarget()) {
        <div class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div class="bg-white rounded-xl p-0 w-full max-w-sm shadow-2xl overflow-hidden">
              <div class="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                 <h3 class="text-gray-800 font-bold">Enviar Proposta</h3>
                 <button (click)="closeOfferModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
              </div>
              
              <div class="p-4">
                 <div class="flex items-center gap-3 mb-4">
                    <img [src]="offerTarget().avatar" class="w-12 h-12 rounded-full object-cover">
                    <div>
                       <p class="font-bold text-gray-900">{{ offerTarget().name }}</p>
                       <p class="text-xs text-gray-500">{{ offerTarget().profession }}</p>
                    </div>
                 </div>

                 <textarea class="w-full border border-gray-300 rounded-lg p-3 text-sm h-32 mb-4 resize-none focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Olá, gostaria de contratar seus serviços para..."></textarea>
                 
                 <div class="flex justify-end gap-2">
                    <button (click)="closeOfferModal()" class="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-full transition-colors">Cancelar</button>
                    <button (click)="submitOffer()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full text-sm transition-colors shadow-sm">Enviar</button>
                 </div>
              </div>
           </div>
        </div>
      }
      
      @if (videoUrl()) {
        <div class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" (click)="closeVideo()">
           <div class="relative w-full max-w-3xl aspect-video bg-black rounded-lg shadow-2xl overflow-hidden" (click)="$event.stopPropagation()">
              <button (click)="closeVideo()" class="absolute top-4 right-4 text-white hover:text-red-500 z-10 bg-black/20 rounded-full p-2 backdrop-blur-sm transition-colors">
                 <i class="fas fa-times text-xl"></i>
              </button>
              <iframe [src]="videoUrl()" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
           </div>
        </div>
      }

      @if (chatTarget()) {
        <app-chat-drawer
          [isOpen]="isChatOpen()"
          [currentUser]="auth.currentUser()!"
          [otherUser]="chatTarget()"
          (close)="closeChat()">
        </app-chat-drawer>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .animate-slide-down { animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-slide-up { animation: slideUp 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DashboardComponent implements OnDestroy {
  auth = inject(AuthService);
  router: Router = inject(Router);
  gemini = inject(GeminiService);
  professionalsService = inject(ProfessionalsService);
  notificationService = inject(NotificationService);
  sanitizer = inject(DomSanitizer);
  
  // Tabs: 'services' | 'communities' (favorites) | 'plans'
  currentTab = signal<'services' | 'communities' | 'plans'>('services');

  // View Mode: 'list' | 'map'
  viewMode = signal<'list' | 'map'>('list');
  
  // Dashboard UI State
  showProfileEditor = signal(false);
  showNotifications = signal(false);
  offerTarget = signal<any>(null); // For Negotiation Modal
  videoUrl = signal<SafeResourceUrl | null>(null);
  
  // AI Input State
  showAiInput = signal(false);
  @ViewChild('aiInput') aiInput!: ElementRef;

  // Map State
  private map: any; // Leaflet Map Instance
  mapSelectedUser = signal<any>(null);

  // My Profile Form Data
  myProfile: ProfessionalProfile = {
    id: '',
    name: '',
    profession: '',
    description: '',
    location: '',
    avatar: '',
    verified: false,
    whatsapp: '',
    videoUrl: '',
    minPrice: undefined,
    priceRate: 'hora',
    availability: 'Imediata'
  };

  userProblem = signal('');
  isAnalyzing = signal(false);
  analysisResult = signal<{
    advice: string;
    suggestedProfession: string;
    urgency: string;
    keywords: string[];
  } | null>(null);

  // Chat State
  isChatOpen = signal(false);
  chatTarget = signal<any>(null);

  constructor() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
    }

    const user = this.auth.currentUser();
    if (user) {
      this.myProfile.id = user.id;
      this.myProfile.name = user.name;
      this.myProfile.profession = user.profession || '';
      this.myProfile.whatsapp = user.phone || '';
      
      const existing = this.professionalsService.professionals().find(p => p.id === user.id);
      if (existing) {
        this.myProfile = { ...this.myProfile, ...existing };
      }
    }

    // Effect to initialize map when view mode changes
    effect(() => {
       if (this.viewMode() === 'map') {
         setTimeout(() => {
           this.initMap();
         }, 100); // Small delay to allow DOM render
       }
    });

    // Request Notification permission on load
    setTimeout(() => this.notificationService.requestPermission(), 3000);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  // --- Sharing Logic (Fixed) ---
  shareApp() {
    // Generate a clean URL for the App root, removing hash fragments like #/dashboard
    // This ensures when shared, the user lands on the Welcome Page.
    // E.g. https://myapp.vercel.app/
    const url = window.location.href.split('#')[0];
    
    const shareData = {
      title: 'AJUDE-IA',
      text: 'Conheça o app que conecta quem precisa a quem resolve!',
      url: url
    };

    if (navigator.share) {
      navigator.share(shareData).catch((err) => console.log('Error sharing:', err));
    } else {
      // Fallback
      navigator.clipboard.writeText(url);
      this.notificationService.push('Link copiado!', 'Cole no WhatsApp para compartilhar.', 'success');
    }
  }

  shareProfile(item: ProfessionalProfile) {
    // For profile sharing, we point to the app. In a real routing scenario we would have /profile/:id
    const url = window.location.href.split('#')[0]; 
    const shareData = {
      title: `${item.name} - ${item.profession}`,
      text: `Veja este profissional no Ajude-IA: ${item.name}`,
      url: url
    };

    if (navigator.share) {
      navigator.share(shareData).catch((err) => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(`${item.name} (${item.profession}): ${url}`);
      this.notificationService.push('Link do perfil copiado!', 'Compartilhe com quem precisa.', 'success');
    }
  }

  toggleFavorite(item: ProfessionalProfile) {
    this.professionalsService.toggleFavorite(item.id);
    if (this.professionalsService.isFavorite(item.id)) {
      this.notificationService.push('Favorito', `${item.name} foi salvo na sua rede.`, 'success');
    }
  }

  // --- View Mode Logic ---
  setViewMode(mode: 'list' | 'map') {
    this.viewMode.set(mode);
    if(mode === 'list') {
        this.mapSelectedUser.set(null);
    }
  }

  // --- Map Logic ---
  initMap() {
    // If map already initialized, remove to reset
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const element = document.getElementById('map');
    if (!element) return;

    // Default center (Sao Paulo)
    const initialCenter = [-23.5505, -46.6333];
    this.map = L.map('map').setView(initialCenter, 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // Add markers for filtered items
    const items = this.filteredItems();
    items.forEach(p => {
        if (p.lat && p.lng) {
            const marker = L.marker([p.lat, p.lng]).addTo(this.map);
            // On click, set selected user signal to show floating card
            marker.on('click', () => {
                this.mapSelectedUser.set(p);
                this.map.setView([p.lat, p.lng], 12, { animate: true });
            });
        }
    });
  }

  closeMapCard() {
    this.mapSelectedUser.set(null);
  }

  // --- Regular Dashboard Logic ---
  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  switchTab(tab: 'services' | 'communities' | 'plans') {
    this.currentTab.set(tab);
    // Reset view mode if leaving services
    if (tab !== 'services' && tab !== 'communities') {
        this.setViewMode('list');
    } else {
        // If coming back to lists, keep list view
        this.setViewMode('list');
    }
  }

  toggleProfileMode() {
    this.currentTab.set('services');
    this.showProfileEditor.update(v => !v);
  }

  toggleNotifications() {
    this.showNotifications.update(v => !v);
  }

  saveProfile() {
    const user = this.auth.currentUser();
    if (!user) return;

    const newProfile: ProfessionalProfile = {
      ...this.myProfile,
      id: user.id,
      name: user.name,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.name}`,
      verified: true
    };

    this.professionalsService.publishProfile(newProfile);
    this.showProfileEditor.set(false);
    this.notificationService.push('Perfil Atualizado', 'Suas informações estão visíveis para clientes.', 'success');
  }

  // --- Video Logic ---
  openVideo(url: string) {
    const videoId = this.extractVideoId(url);
    if(videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        this.videoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
    } else {
        window.open(url, '_blank');
    }
  }

  closeVideo() {
    this.videoUrl.set(null);
  }

  private extractVideoId(url: string) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  }

  // --- Negotiation / Offer Logic ---
  openOfferModal(item: any) {
    this.offerTarget.set(item);
  }

  closeOfferModal() {
    this.offerTarget.set(null);
  }

  submitOffer() {
    this.notificationService.push('Proposta Enviada', `Sua oferta foi enviada para ${this.offerTarget()?.name}!`, 'success');
    this.closeOfferModal();
  }

  // --- Chat Logic ---
  openChat(item: any) {
    this.chatTarget.set(item);
    this.isChatOpen.set(true);
  }

  closeChat() {
    this.isChatOpen.set(false);
    setTimeout(() => this.chatTarget.set(null), 300);
  }

  // --- AI Logic ---
  focusAiInput() {
    this.showAiInput.set(true);
    setTimeout(() => {
        if(this.aiInput) this.aiInput.nativeElement.focus();
    }, 100);
  }

  clearAnalysis() {
    this.analysisResult.set(null);
    this.userProblem.set('');
    this.showAiInput.set(false);
  }

  async analyzeProblem() {
    if (!this.userProblem()) return;

    this.isAnalyzing.set(true);
    this.analysisResult.set(null);

    try {
      const result = await this.gemini.analyzeRequest(this.userProblem());
      this.analysisResult.set(result);
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  filteredItems = computed(() => {
    // 1. Get Base Items
    let allItems = this.professionalsService.professionals();

    // 2. Filter by Tab (Favorites vs All)
    if (this.currentTab() === 'communities') {
        allItems = allItems.filter(p => this.professionalsService.isFavorite(p.id));
    }

    // 3. Filter by AI Search
    const result = this.analysisResult();
    if (!result) return allItems;

    const targetProf = result.suggestedProfession.toLowerCase();
    
    return [...allItems].sort((a, b) => {
      const aMatch = a.profession.toLowerCase().includes(targetProf) || targetProf.includes(a.profession.toLowerCase());
      const bMatch = b.profession.toLowerCase().includes(targetProf) || targetProf.includes(b.profession.toLowerCase());
      return Number(bMatch) - Number(aMatch);
    });
  });
}
