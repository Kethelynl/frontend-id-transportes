export interface Company {
  id: string;
  name: string;
  domain: string;
  email: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  status: 'ACTIVE' | 'INACTIVE';
  subscription_plan?: string;
  max_users?: number;
  max_drivers?: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role?: 'MASTER' | 'ADMIN' | 'SUPERVISOR' | 'OPERATOR' | 'DRIVER' | 'CLIENT' | 'ADMINISTRADOR' | 'MOTORISTA' | 'OPERADOR' | 'CLIENTE';
  user_type?: 'MASTER' | 'ADMIN' | 'SUPERVISOR' | 'OPERATOR' | 'DRIVER' | 'CLIENT' | 'ADMINISTRADOR' | 'MOTORISTA' | 'OPERADOR' | 'CLIENTE';
  name?: string;
  cpf?: string;
  status?: 'ATIVO' | 'INATIVO';
  is_active?: number | boolean;
  company_id?: string;
  company_name?: string;
  company_domain?: string;
  driver_id?: string | number;
  user_id?: string;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  authStep: 'login' | 'company' | 'complete';
  login: (credentials: LoginCredentials) => Promise<void>;
  selectCompany: (companyId: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CompanySelectionResponse {
  token: string;
  user: User;
}

export interface CompaniesResponse {
  id: string;
  name: string;
  domain: string;
  email: string;
  subscription_plan: string;
}

export interface DriverLocation {
  driver_id: string;
  driver_name: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  last_update: string;
  status: string;
  activity_status: 'idle' | 'active';
  current_delivery_id?: string;
  current_delivery_client?: string;
}

export interface DriverHistoryPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  delivery_id?: string;
}
