import { LoginCredentials, ApiResponse, User, Company, DriverLocation, DriverHistoryPoint } from '@/types/auth';
import { getBaseUrl } from '@/config/api';

class ApiService {
  private isTokenValid(): boolean {
    let token = localStorage.getItem('id_transporte_token');
    if (!token) {
      token = localStorage.getItem('temp_token');
    }
    if (!token) {
      return false;
    }
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  

  private getAuthHeader(): Record<string, string> {
    let token = localStorage.getItem('id_transporte_token');
    if (!token) {
      token = localStorage.getItem('temp_token');
    }
    if (token) {
      if (!this.isTokenValid()) {
        localStorage.removeItem('id_transporte_token');
        localStorage.removeItem('id_transporte_user');
        localStorage.removeItem('id_transporte_company');
        localStorage.removeItem('temp_token');
        localStorage.removeItem('temp_user');
        return {};
      }
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const baseUrl = getBaseUrl(endpoint);
      const fullUrl = `${baseUrl}${endpoint}`;
      
      const headers = {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      };

      if (options.body instanceof FormData) {
        delete headers['Content-Type'];
      }
      
      const response = await fetch(fullUrl, {
        headers,
        ...options,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.error?.includes('secretOrPrivateKey')) {
          throw new Error('Erro de configuração do servidor. Entre em contato com o administrador.');
        }
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data && typeof data === 'object' && 'success' in data) {
        return data as ApiResponse<T>;
      }
      return { success: true, data };
    } catch (error) {
      let errorMessage = 'Erro de conexão';
      if (error instanceof Error) {
        if (error.message.includes('secretOrPrivateKey')) {
          errorMessage = 'Erro de configuração do servidor. Entre em contato com o administrador.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
        } else {
          errorMessage = error.message;
        }
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Dentro de src/services/api.ts, na classe ApiService

  public async attachReceipt(deliveryId: string, driverId: string, receiptFile: File): Promise<any> {
    const formData = new FormData();
    // O serviço de canhotos espera o arquivo no campo 'file' e os IDs
    formData.append('file', receiptFile);
    formData.append('delivery_id', deliveryId);
    formData.append('driver_id', driverId);

    // CORREÇÃO: A rota correta para upload de canhotos é no serviço de canhotos (porta 3004)
    // e não no serviço de entregas.
    return this.request(`/api/receipts/upload`, {
      method: 'POST',
      body: formData,
      // Não definimos 'Content-Type', o navegador fará isso automaticamente para multipart/form-data
    });
  }

  /**
   * Busca um arquivo de uma URL protegida e retorna uma URL de objeto (blob) para exibição.
   * @param url A URL do recurso protegido.
   * @returns Uma string contendo a URL do blob ou null em caso de erro.
   */
  public async getSecureFile(url: string): Promise<string | null> {
    try {
      const headers = this.getAuthHeader();
      if (Object.keys(headers).length === 0) {
        throw new Error("Usuário não autenticado.");
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Falha ao buscar o arquivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);

    } catch (error) {
      console.error("Erro em getSecureFile:", error);
      // Propaga o erro para ser tratado no componente
      throw error;
    }
  }

  // Auth methods
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<{
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
      full_name: string;
      user_type: string;
      company_id?: string;
      company_name?: string;
      company_domain?: string;
    };
  }>> {
    // CORREÇÃO: Removida a declaração duplicada
    const response = await this.request<{ data: { token: string; user: any } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // CORREÇÃO: A API de login retorna um objeto `data` aninhado.
  // Precisamos desempacotar a resposta para que o frontend receba { success: true, data: { token, user } }
  // diretamente, em vez de { success: true, data: { data: { token, user } } }.
  if (response.success && response.data && response.data.data) {
    return { ...response, data: response.data.data };
  }

  return response as any; // Retorna a resposta original se a estrutura for inesperada
}

  // Função para o fluxo de login (serviço de autenticação)
  async getAuthCompanies(): Promise<ApiResponse<Array<{ id: string; name: string; domain: string }>>> {
    const response = await this.request<{ data: Array<{ id: string; name: string; domain: string }> }>('/api/auth/companies');

    // CORREÇÃO: A API pode retornar um objeto `data` aninhado.
    // Desempacota a resposta para que o frontend receba { success: true, data: [...] }
    if (response.success && response.data && (response.data as any).data) {
      return { ...response, data: (response.data as any).data };
    }

    return response as any;
  }

async getReceiptsReport() {
    // CORREÇÃO: Remove a propriedade 'baseUrl' inválida e passa apenas o endpoint e o método.
    return this.request('/api/deliveries/with-receipts', {
        method: 'GET', 
    });
}

  // Função para o gerenciamento de empresas (serviço de empresas)
  async getManagementCompanies(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    domain: string;
    email: string;
    subscription_plan: string;
  }>>> {
    return this.request('/api/companies'); // Endpoint correto para gerenciamento
  }

  /**
   * @deprecated A função getCompanies() é ambígua. Use getAuthCompanies() para o fluxo de login ou getManagementCompanies() para gerenciamento.
   */
  async getCompanies(): Promise<ApiResponse<any[]>> {
    console.warn(
      "A função getCompanies() é ambígua e será removida. Use getAuthCompanies() para login ou getManagementCompanies() para gerenciamento."
    );
    // Por segurança, redireciona para a função de gerenciamento, que é o uso mais comum nos dashboards.
    return this.getManagementCompanies();
  }

  async selectCompany(companyId: string): Promise<ApiResponse<{
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
      full_name: string;
      user_type: string;
      company_id: string;
    };
  }>> {
    return this.request('/api/auth/select-company', {
      method: 'POST',
      body: JSON.stringify({ company_id: companyId }),
    });
  }

  async refreshToken(): Promise<ApiResponse<{ token: string; expires_in: number }>> {
    return this.request('/api/auth/refresh', {
      method: 'POST',
    });
  }

  

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Receipts endpoints (Upload e Processamento de Canhotos)
  async uploadReceipt(formData: FormData): Promise<ApiResponse<{
    id: string;
    filename: string;
    url: string;
    processed: boolean;
    status: string;
  }>> {
    return this.request('/api/receipts/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async processReceiptOCR(receiptId: string): Promise<ApiResponse<{
    ocr_data: {
      nf_number: string;
      client_name: string;
      address: string;
      value: number;
      items: Array<Record<string, unknown>>;
    };
    raw_text: string;
  }>> {
    return this.request(`/api/receipts/${receiptId}/process-ocr`, { method: 'POST' });
  }
  
  async smartProcessDocument(file: File): Promise<ApiResponse<{
    extractedData: {
      nfNumber?: string;
      clientName?: string;
      clientCnpj?: string;
      deliveryAddress?: string;
      merchandiseValue?: string;
      volume?: string;
      weight?: string;
      issueDate?: string;
      dueDate?: string;
      observations?: string;
      nfeKey?: string;
    };
    rawText: string;
    entities: Array<Record<string, unknown>>;
    confidence: number;
    uploadUrl?: string;
    rawFields?: Record<string, string[]>;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/api/receipts/process-documentai', {
      method: 'POST',
      body: formData,
    });
  }

  async validateReceipt(receiptId: string, validationData: {
    ocr_data: Record<string, unknown>;
    validated: boolean;
    corrections?: Record<string, unknown>;
  }): Promise<ApiResponse<Record<string, unknown>>> {
    return this.request(`/api/receipts/${receiptId}/validate`, {
      method: 'PUT',
      body: JSON.stringify(validationData),
    });
  }

  async getReceipts(filters?: {
    delivery_id?: string;
    driver_id?: string;
    status?: string;
  }): Promise<ApiResponse<Array<{
    id: string;
    delivery_id: string;
    driver_id: string;
    filename: string;
    status: string;
    ocr_data?: Record<string, unknown>;
    validated: boolean;
    created_at: string;
  }>>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request(`/api/receipts${queryParams}`);
  }

  // Tracking endpoints (Rastreamento em Tempo Real)
  async sendLocation(locationData: {
    driver_id: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    speed?: number;
    heading?: number;
    delivery_id?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request('/api/tracking/location', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async getCurrentLocations(): Promise<ApiResponse<Array<{
    driver_id: string;
    driver_name: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
    last_update: string;
    status: string;
    current_delivery_id?: string;
    current_delivery_client?: string;
  }>>> {
    return this.request('/api/tracking/drivers/current-locations');
  }

  async getTrackingHistory(driverId: string, filters?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Array<{
    timestamp: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
    delivery_id?: string;
  }>>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request(`/api/tracking/drivers/${driverId}/history${queryParams}`);
  }

  // Occurrences endpoints (Gestão de Ocorrências)
  async createOccurrence(deliveryId: string, occurrenceData: {
    type: 'reentrega' | 'recusa' | 'avaria';
    description: string;
    photo?: File;
    latitude?: number;
    longitude?: number;
  }): Promise<ApiResponse<{
    id: string;
    delivery_id: string;
    type: string;
    description: string;
    photo_url?: string;
    created_at: string;
  }>> {
    const formData = new FormData();
    formData.append('type', occurrenceData.type);
    formData.append('description', occurrenceData.description);
    
    if (occurrenceData.photo) {
      formData.append('photo', occurrenceData.photo);
    }
    
    if (occurrenceData.latitude) {
      formData.append('latitude', occurrenceData.latitude.toString());
    }
    
    if (occurrenceData.longitude) {
      formData.append('longitude', occurrenceData.longitude.toString());
    }

    return this.request(`/api/deliveries/${deliveryId}/occurrence`, {
      method: 'POST',
      body: formData,
    });
  }

  async getOccurrences(filters?: {
    company_id?: string;
    type?: string;
    start_date?: string;
    end_date?: string;
    driver_id?: string;
  }): Promise<ApiResponse<Array<{
    id: string;
    delivery_id: string;
    type: string;
    description: string;
    photo_url?: string;
    driver_name: string;
    client_name: string;
    created_at: string;
  }>>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request(`/api/occurrences${queryParams}`);
  }

  async getOccurrenceDetails(occurrenceId: string): Promise<ApiResponse<{
    id: string;
    delivery_id: string;
    type: string;
    description: string;
    photo_url?: string;
    latitude?: number;
    longitude?: number;
    driver_name: string;
    client_name: string;
    created_at: string;
  }>> {
    return this.request(`/api/occurrences/${occurrenceId}`);
  }

  // Reports endpoints (Relatórios Avançados)
  async getDeliveryReports(filters?: {
    company_id?: string;
    start_date?: string;
    end_date?: string;
    driver_id?: string;
    client_id?: string;
    status?: string;
    format?: 'json' | 'pdf' | 'excel';
  }): Promise<ApiResponse<{
    summary: {
      total: number;
      completed: number;
      pending: number;
      cancelled: number;
      refused: number;
      avg_delivery_time: number;
    };
    daily_progress: Array<{
      date: string;
      total: number;
      completed: number;
      pending: number;
    }>;
    status_distribution: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    driver_performance: Array<{
      driver_name: string;
      total_deliveries: number;
      completed_deliveries: number;
      success_rate: number;
      avg_delivery_time: number;
    }>;
  }>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request(`/api/reports/deliveries${queryParams}`);
  }

  async getDriverPerformanceReports(filters?: {
    company_id?: string;
    start_date: string;
    end_date: string;
    driver_id?: string;
  }): Promise<ApiResponse<Array<{
    driver_id: string;
    driver_name: string;
    total_deliveries: number;
    completed_deliveries: number;
    success_rate: number;
    average_time: number;
    occurrences: number;
    occurrence_rate: number;
    performance_score: number;
  }>>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request(`/api/reports/driver-performance${queryParams}`);
  }

  async getClientVolumeReports(filters?: {
    company_id?: string;
    start_date: string;
    end_date: string;
    client_id?: string;
  }): Promise<ApiResponse<Array<{
    client_id: string;
    client_name: string;
    total_deliveries: number;
    total_value: number;
    average_value: number;
    completed_deliveries: number;
    success_rate: number;
    growth_rate: number;
  }>>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request(`/api/reports/client-volume${queryParams}`);
  }

  async getDailyStatus(): Promise<ApiResponse<{
    total_deliveries: number;
    completed_deliveries: number;
    pending_deliveries: number;
    active_drivers: number;
    total_revenue: number;
  }>> {
    return this.request('/api/reports/daily-status');
  }

  async getOccurrencesReports(filters?: {
    company_id?: string;
    start_date?: string;
    end_date?: string;
    type?: string;
    search?: string;
  }): Promise<ApiResponse<Array<{
    id: string;
    delivery_id: string;
    type: string;
    description: string;
    driver_name: string;
    client_name: string;
    created_at: string;
  }>>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request(`/api/reports/occurrences${queryParams}`);
  }

  async getReceiptsReports(filters?: {
    company_id?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Array<{
    id: string;
    delivery_id: string;
    driver_name: string;
    filename: string;
    status: string;
    validated: boolean;
    created_at: string;
  }>>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request(`/api/reports/receipts${queryParams}`);
  }

  // Dashboard endpoints (KPIs)
  async getDashboardKPIs(): Promise<ApiResponse<{
    today_deliveries: {
      total: number;
      completed: number;
      pending: number;
    };
    active_drivers: number;
    pending_occurrences: number;
    performance_score: number;
    revenue_today: number;
    efficiency_rate: number;
  }>> {
    return this.request('/api/dashboard/kpis');
  }



  // Deliveries endpoints (Gestão de Entregas)
  
  async getDeliveries(filters?: {
    status?: string;
    driver_id?: string;
    client_id?: string;
  }): Promise<ApiResponse<Array<{
    id: string;
    nf_number: string;
    client_name: string;
    client_address: string;
    merchandise_value: number;
    status: string;
    driver_name?: string;
    driver_id?: string;
    has_receipt?: boolean;
    created_at: string;
  }>>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request(`/api/deliveries${queryParams}`);
  }

  async getDeliveryDetails(deliveryId: string): Promise<ApiResponse<{
    id: string;
    nf_number: string;
    client_name: string;
    client_address: string;
    client_phone: string;
    merchandise_value: number;
    status: string;
    driver_name: string;
    notes: string;
    created_at: string;
    occurrences: Array<{
      id: string;
      type: string;
      description: string;
      created_at: string;
    }>;
  }>> {
    return this.request(`/api/deliveries/${deliveryId}`);
  }

  async updateDeliveryStatus(deliveryId: string, statusData: {
    status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'REFUSED';
    notes?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/deliveries/${deliveryId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }



  async createCompany(companyData: {
    name: string;
    cnpj: string;
    domain: string;
    email: string;
    subscription_plan: string;
    max_users: number;
    max_drivers: number;
  }): Promise<ApiResponse<{
    message: string;
    company_id: string;
    admin_credentials: {
      username: string;
      password: string;
    };
  }>> {
    return this.request('/api/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  }

  async updateCompany(companyId: string, companyData: {
    name?: string;
    cnpj?: string;
    domain?: string;
    email?: string;
    subscription_plan?: string;
    max_users?: number;
    max_drivers?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  }

  async getCompanyStats(companyId: string): Promise<ApiResponse<{
    users: number;
    drivers: number;
    vehicles: number;
    clients: number;
    total_deliveries: number;
    active_deliveries: number;
  }>> {
    return this.request(`/api/companies/${companyId}/stats`);
  }

  async getCompanySettings(companyId: string): Promise<ApiResponse<{
    company_id: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    company_name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    timezone: string;
    currency: string;
    language: string;
    notifications: {
      email_notifications: boolean;
      sms_notifications: boolean;
      push_notifications: boolean;
    };
    delivery_settings: {
      max_delivery_time: number;
      auto_assign_drivers: boolean;
      require_signature: boolean;
      require_photo: boolean;
    };
  }>> {
    return this.request(`/api/companies/${companyId}/settings`);
  }

  async updateCompanySettings(companyId: string, settings: Record<string, unknown>): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/companies/${companyId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async uploadCompanyLogo(companyId: string, logoFile: File): Promise<ApiResponse<{
    logo_url: string;
    message: string;
  }>> {
    const formData = new FormData();
    formData.append('logo', logoFile);

    const token = localStorage.getItem('id_transporte_token');
    
    try {
      const baseUrl = getBaseUrl('/api/companies');
      const response = await fetch(`${baseUrl}/api/companies/${companyId}/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no upload do logo',
      };
    }
  }

  // Drivers and Vehicles endpoints
  async getDrivers(filters?: {
    status?: string;
    vehicle_id?: string;
  }): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    cpf: string;
    cnh: string;
    phone: string;
    email: string;
    status: string;
    vehicle_id?: string;
    vehicle_plate?: string;
    vehicle_model?: string;
    created_at: string;
  }>>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request(`/api/drivers${queryParams}`);
  }

  async registerDriverAccount(payload: {
    username: string;
    password: string;
    email: string;
    full_name: string;
    cpf: string;
    phone?: string;
    cnh?: string;
    company_id: string | number;

  }): Promise<ApiResponse<{
    user: User;
    driver: Record<string, unknown>;
  }>> {
    // CORREÇÃO: A rota POST /api/drivers já lida com a criação do usuário associado.
    // Não é necessário chamar /api/users (createUser) separadamente.
    try {
      // A rota POST /api/drivers aceita todos os campos para criar o motorista e o usuário.
      // CORREÇÃO: O backend espera o campo 'name', mas o formulário envia 'full_name'.
      // Mapeamos 'full_name' para 'name' para garantir compatibilidade.
      const response = await this.createDriver({
        ...payload,
        name: payload.full_name,
      });
      if (!response.success) {
        throw new Error(response.error || 'Falha ao registrar a conta do motorista.');
      }
      return {
        success: true,
        data: response.data as any, // A resposta de createDriver já é suficiente
      };
    } catch (error: any) {
      console.error("Erro em registerDriverAccount:", error);
      return { success: false, error: error.message };
    }
  }

  async createDriver(driverData: {
    name?: string; // name é opcional pois pode vir como full_name
    cpf: string;
    cnh?: string;
    phone?: string;
    username?: string;
    password?: string;
    user_id?: string; // Adicionado para vincular ao usuário
    email?: string;
    full_name?: string; // Adicionado para compatibilidade com registerDriverAccount
    company_id?: string | number;
  }): Promise<ApiResponse<{
    id: string;
    name: string;
    cpf: string;
    cnh: string;
    phone: string;
    email: string;
    status: string;
    vehicle_id?: string;
    created_at: string;
  }>> {
    return this.request('/api/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData),
    });
  }

  async updateDriver(driverId: string, driverData: {
    name?: string;
    phone?: string;
    email?: string;
    status?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/drivers/${driverId}`, {
      method: 'PUT',
      body: JSON.stringify(driverData),
    });
  }

  async getDriverDetails(driverId: string): Promise<ApiResponse<{
    id: string;
    name: string;
    cpf: string;
    cnh: string;
    phone: string;
    email: string;
    status: string;
    vehicle?: {
      id: string;
      plate: string;
      model: string;
      year: number;
      color: string;
    };
    statistics: {
      total_deliveries: number;
      completed_deliveries: number;
      success_rate: number;
      avg_delivery_time: number;
    };
    created_at: string;
  }>> {
    return this.request(`/api/drivers/${driverId}`);
  }

  async getVehicles(filters?: {
    status?: string;
  }): Promise<ApiResponse<Array<{
    id: string;
    plate: string;
    model: string;
    brand: string;
    year: number;
    color: string;
    status: string;
    driver_name?: string;
    created_at: string;
  }>>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : '';
    return this.request(`/api/vehicles${queryParams}`);
  }

  async createVehicle(vehicleData: {
    plate: string;
    model: string;
    brand: string;
    year: number;
    color: string;
    driver_id?: string;
  }): Promise<ApiResponse<{
    id: string;
    plate: string;
    model: string;
    brand: string;
    year: number;
    color: string;
    status: string;
    driver_id?: string;
    created_at: string;
  }>> {
    return this.request('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  }

  async updateVehicle(vehicleId: string, vehicleData: {
    plate?: string;
    model?: string;
    brand?: string;
    year?: number;
    color?: string;
    driver_id?: string;
    status?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
  }

  async deleteVehicle(vehicleId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/vehicles/${vehicleId}`, {
      method: 'DELETE',
    });
  }

  // Users management
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/api/users');
  }

  async createUser(userData: unknown): Promise<ApiResponse<User>> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: unknown): Promise<ApiResponse<User>> {
    return this.request(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async sendDriverLocation(locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    delivery_id?: string | null;
    driver_id?: string;
  }): Promise<ApiResponse<{ success: boolean }>> {
    return this.request('/api/tracking/location', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async getDriverCurrentLocations(): Promise<ApiResponse<DriverLocation[]>> {
    return this.request('/api/tracking/drivers/current-locations');
  }

  async getDriverHistory(driverId: string, options?: { start_date?: string; end_date?: string }): Promise<ApiResponse<DriverHistoryPoint[]>> {
    const queryParams = options ? `?${new URLSearchParams(options as Record<string, string>).toString()}` : '';
    return this.request(`/api/tracking/drivers/${driverId}/history${queryParams}`);
  }

  async updateDriverStatus(driverId: string, status: 'online' | 'offline' | 'idle'): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/api/tracking/drivers/${driverId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Método para criar entrega a partir de dados SEFAZ
  async createDelivery(payload: { file?: File, [key: string]: any }): Promise<ApiResponse<{
    id: string;
    nf_number: string;
    client_name: string;
    client_address: string;
    merchandise_value: number;
    status: string;
    message: string;
  }>> {
    const formData = new FormData();

    // Itera sobre o payload para adicionar os campos ao FormData
    for (const key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const value = payload[key];
        if (value === undefined || value === null) {
          continue;
        }

        if (value instanceof Blob) {
          formData.append(key, value);
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    }

    return this.request('/api/deliveries/create-from-sefaz', {
      method: 'POST',
      body: formData, // Envia o FormData em vez de JSON
    });
  }
}

export const apiService = new ApiService();