
import { Injectable, signal, effect } from '@angular/core';

export interface ProfessionalProfile {
  id: string; // usually maps to userId
  name: string;
  profession: string;
  description: string;
  location: string;
  avatar: string;
  verified: boolean;
  whatsapp?: string;
  videoUrl?: string; // Optional video presentation URL
  minPrice?: number; // Minimum price suggestion
  priceRate?: string; // e.g. "por hora", "por dia"
  experience?: string; // e.g. "10 anos"
  availability?: 'Imediata' | 'Agendamento' | 'Indisponível';
  lat?: number; // Latitude
  lng?: number; // Longitude
}

@Injectable({
  providedIn: 'root'
})
export class ProfessionalsService {
  private readonly STORAGE_KEY = 'ajude_professionals_db';
  private readonly FAV_KEY = 'ajude_favorites';
  
  // The live list of professionals
  professionals = signal<ProfessionalProfile[]>([]);
  favorites = signal<string[]>([]); // List of IDs

  constructor() {
    this.loadProfessionals();
    this.loadFavorites();
  }

  private loadFavorites() {
    const stored = localStorage.getItem(this.FAV_KEY);
    if (stored) {
      this.favorites.set(JSON.parse(stored));
    }
  }

  toggleFavorite(id: string) {
    this.favorites.update(current => {
      let newList;
      if (current.includes(id)) {
        newList = current.filter(favId => favId !== id);
      } else {
        newList = [...current, id];
      }
      localStorage.setItem(this.FAV_KEY, JSON.stringify(newList));
      return newList;
    });
  }

  isFavorite(id: string): boolean {
    return this.favorites().includes(id);
  }

  private loadProfessionals() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.professionals.set(JSON.parse(stored));
    } else {
      // Seed initial data (Mock Database) with coordinates (Brazil Cities)
      const seedData: ProfessionalProfile[] = [
        {
          id: '101',
          name: 'Dr. Roberto Silva',
          profession: 'Médico',
          description: 'Clínico geral com foco em atendimento domiciliar de urgência. Experiência em pronto-socorro.',
          location: 'São Paulo, SP',
          avatar: 'https://picsum.photos/100/100?random=1',
          verified: true,
          whatsapp: '11999999999',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          minPrice: 300,
          priceRate: 'consulta',
          availability: 'Imediata',
          lat: -23.5505,
          lng: -46.6333
        },
        {
          id: '102',
          name: 'Maria Oliveira',
          profession: 'Cuidadora',
          description: 'Especialista em cuidados com idosos e suporte pós-cirúrgico. Disponibilidade noturna.',
          location: 'Rio de Janeiro, RJ',
          avatar: 'https://picsum.photos/100/100?random=2',
          verified: true,
          whatsapp: '21988888888',
          minPrice: 80,
          priceRate: 'hora',
          availability: 'Agendamento',
          lat: -22.9068,
          lng: -43.1729
        },
        {
          id: '103',
          name: 'Carlos Mendes',
          profession: 'Eletricista',
          description: 'Resolução de curtos-circuitos, instalação de chuveiros e quadros de força.',
          location: 'Belo Horizonte, MG',
          avatar: 'https://picsum.photos/100/100?random=3',
          verified: false,
          whatsapp: '',
          minPrice: 150,
          priceRate: 'visita',
          availability: 'Imediata',
          lat: -19.9167,
          lng: -43.9345
        },
        {
          id: '104',
          name: 'Dra. Ana Costa',
          profession: 'Psicóloga',
          description: 'Terapia cognitivo-comportamental para ansiedade, pânico e depressão. Atendimento online.',
          location: 'Online / SP',
          avatar: 'https://picsum.photos/100/100?random=4',
          verified: true,
          whatsapp: '11977777777',
          minPrice: 200,
          priceRate: 'sessão',
          availability: 'Agendamento',
          lat: -23.58, 
          lng: -46.65
        },
        {
          id: '105',
          name: 'João Pedro',
          profession: 'Motoboy',
          description: 'Entregas expressas de farmácia e mercado. Rapidez e segurança.',
          location: 'Porto Alegre, RS',
          avatar: 'https://picsum.photos/100/100?random=5',
          verified: false,
          whatsapp: '51966666666',
          minPrice: 20,
          priceRate: 'corrida',
          availability: 'Imediata',
          lat: -30.0346,
          lng: -51.2177
        },
        {
          id: '106',
          name: 'Marcos Encanamentos',
          profession: 'Encanador',
          description: 'Caça vazamentos, desentupimento de esgoto e pias. Atendimento 24h.',
          location: 'Curitiba, PR',
          avatar: 'https://picsum.photos/100/100?random=6',
          verified: true,
          whatsapp: '',
          minPrice: 120,
          priceRate: 'hora',
          availability: 'Imediata',
          lat: -25.4284,
          lng: -49.2733
        }
      ];
      this.professionals.set(seedData);
      this.saveToStorage(seedData);
    }
  }

  // Add or Update a professional listing
  publishProfile(profile: ProfessionalProfile) {
    this.professionals.update(currentList => {
      const index = currentList.findIndex(p => p.id === profile.id);
      let newList;
      if (index >= 0) {
        // Update existing
        newList = [...currentList];
        newList[index] = profile;
      } else {
        // Add new
        newList = [profile, ...currentList];
      }
      this.saveToStorage(newList);
      return newList;
    });
  }

  private saveToStorage(data: ProfessionalProfile[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}
