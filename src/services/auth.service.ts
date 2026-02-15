import { Injectable, signal } from '@angular/core';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Stored as Hash
  role: 'user' | 'professional';
  profession?: string;
  avatar?: string;
  phone?: string;
  createdAt?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY_USER = 'ajude_current_user';
  private readonly STORAGE_KEY_DB = 'ajude_users_db';

  currentUser = signal<User | null>(null);

  constructor() {
    this.loadSession();
    this.initializeDb();
  }

  private loadSession() {
    const storedUser = localStorage.getItem(this.STORAGE_KEY_USER);
    if (storedUser) {
      try {
        this.currentUser.set(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user', e);
        this.logout();
      }
    }
  }

  private async initializeDb() {
    if (!localStorage.getItem(this.STORAGE_KEY_DB)) {
      // Create initial users with hashed passwords for demo purposes
      const hash123 = await this.hashPassword('123');
      
      const initialUsers: User[] = [
        { id: '1', name: 'Dr. Exemplo', email: 'pro@exemplo.com', password: hash123, role: 'professional', profession: 'Médico', phone: '11999999999', createdAt: Date.now() },
        { id: '2', name: 'Visitante', email: 'user@exemplo.com', password: hash123, role: 'user', phone: '11988888888', createdAt: Date.now() }
      ];
      localStorage.setItem(this.STORAGE_KEY_DB, JSON.stringify(initialUsers));
    }
  }

  // --- Security: Hashing ---
  private async hashPassword(plainText: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // --- Actions ---

  async login(email: string, password: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const db = this.getUsersFromStorage();
    // Compare hashes, never plain text
    const user = db.find(u => u.email === email && u.password === passwordHash);

    if (user) {
      this.startSession(user);
      return true;
    } else {
      throw new Error('Email ou senha inválidos.');
    }
  }

  async socialLogin(provider: string, role: 'user' | 'professional'): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: `social_${provider}_${Date.now()}`,
      name: `Usuário ${provider}`,
      email: `user@${provider.toLowerCase()}.com`,
      role: role,
      profession: role === 'professional' ? 'Profissional Verificado' : '',
      avatar: `https://ui-avatars.com/api/?name=${provider}&background=random`,
      phone: '',
      createdAt: Date.now()
    };
    
    const db = this.getUsersFromStorage();
    // Check if social user exists, if not add
    if (!db.find(u => u.email === mockUser.email)) {
       db.push(mockUser);
       localStorage.setItem(this.STORAGE_KEY_DB, JSON.stringify(db));
    }

    this.startSession(mockUser);
    return true;
  }

  async register(data: Partial<User>): Promise<boolean> {
    const passwordHash = await this.hashPassword(data.password!);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    const db = this.getUsersFromStorage();
    
    if (db.find(u => u.email === data.email)) {
      throw new Error('Este email já está cadastrado.');
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: data.name!,
      email: data.email!,
      password: passwordHash, // Store hash
      role: data.role as 'user' | 'professional',
      profession: data.profession || '',
      phone: data.phone || '',
      avatar: `https://ui-avatars.com/api/?name=${data.name}&background=random`,
      createdAt: Date.now()
    };

    db.push(newUser);
    localStorage.setItem(this.STORAGE_KEY_DB, JSON.stringify(db));
    
    this.startSession(newUser);
    return true;
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(this.STORAGE_KEY_USER);
  }

  isLoggedIn() {
    return this.currentUser() !== null;
  }

  // --- Helpers ---

  private startSession(user: User) {
    // Remove password hash from session storage for extra safety
    const { password, ...safeUser } = user; 
    this.currentUser.set(safeUser as User);
    localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(safeUser));
  }

  private getUsersFromStorage(): User[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY_DB) || '[]');
    } catch {
      return [];
    }
  }
}