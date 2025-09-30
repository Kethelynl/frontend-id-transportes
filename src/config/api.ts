// Configuração centralizada da API - Multi-Tenant System
export const API_CONFIG = {
  // ✅ Portas corretas dos serviços
  AUTH_SERVICE: 'http://localhost:3001',    // ✅ auth-service (onde está o endpoint /api/auth/companies)
  AUTH_USERS: 'http://localhost:3001',      // ✅ auth-users-service (não tem endpoint de companies)
  DRIVERS: 'http://localhost:3002',         // ✅ drivers-vehicles-service
  DELIVERIES: 'http://localhost:3003',      // ✅ deliveries-routes-service
  RECEIPTS: 'http://localhost:3004',        // ✅ receipts-ocr-service
  TRACKING: 'http://localhost:3005',        // ✅ tracking-service
  REPORTS: 'http://localhost:3006',         // ✅ reports-service
  COMPANIES: 'http://localhost:3007'        // ✅ companies-service
};

// Configuração para variáveis de ambiente (produção)
export const getApiConfig = () => ({
  AUTH_SERVICE: import.meta.env.VITE_AUTH_API_URL || API_CONFIG.AUTH_SERVICE,
  AUTH_USERS: import.meta.env.VITE_AUTH_USERS_API_URL || API_CONFIG.AUTH_USERS,
  DRIVERS: import.meta.env.VITE_DRIVERS_API_URL || API_CONFIG.DRIVERS,
  DELIVERIES: import.meta.env.VITE_DELIVERIES_API_URL || API_CONFIG.DELIVERIES,
  RECEIPTS: import.meta.env.VITE_RECEIPTS_API_URL || API_CONFIG.RECEIPTS,
  TRACKING: import.meta.env.VITE_TRACKING_API_URL || API_CONFIG.TRACKING,
  REPORTS: import.meta.env.VITE_REPORTS_API_URL || API_CONFIG.REPORTS,
  COMPANIES: import.meta.env.VITE_COMPANIES_API_URL || API_CONFIG.COMPANIES,
});

// Função auxiliar para determinar a base URL pelo endpoint
export function getBaseUrl(endpoint: string): string {
  const config = getApiConfig();
  
  // ✅ Autenticação (inclui /api/auth/companies)
  if (endpoint.startsWith('/api/auth')) {
    return config.AUTH_SERVICE;
  }
  
  // ✅ Usuários (gerenciamento de usuários)
  if (endpoint.startsWith('/api/users')) {
    return config.AUTH_USERS;
  }
  
  // ✅ Motoristas e Veículos
  if (endpoint.startsWith('/api/drivers') || endpoint.startsWith('/api/vehicles')) {
    return config.DRIVERS;
  }
  
  // ✅ Entregas, Rotas e Ocorrências
  if (endpoint.startsWith('/api/deliveries') || 
      endpoint.startsWith('/api/routes') || 
      endpoint.startsWith('/api/occurrences')) {
    return config.DELIVERIES;
  }
  
  // ✅ Comprovantes e OCR
  if (endpoint.startsWith('/api/receipts')) {
    return config.RECEIPTS;
  }
  
  // ✅ Rastreamento
  if (endpoint.startsWith('/api/tracking')) {
    return config.TRACKING;
  }
  
  // ✅ Relatórios e Dashboard
  if (endpoint.startsWith('/api/reports') || endpoint.startsWith('/api/dashboard')) {
    return config.REPORTS;
  }
  
  // ✅ Empresas
  if (endpoint.startsWith('/api/companies')) {
    return config.COMPANIES;
  }
  
  // Fallback para autenticação
  return config.AUTH_SERVICE;
}

// Tipos para configuração
export interface ApiConfig {
  AUTH_SERVICE: string;
  AUTH_USERS: string;
  DRIVERS: string;
  DELIVERIES: string;
  RECEIPTS: string;
  TRACKING: string;
  REPORTS: string;
  COMPANIES: string;
}

// Exportação padrão
export default API_CONFIG; 
