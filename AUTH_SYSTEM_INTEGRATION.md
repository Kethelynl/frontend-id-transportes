# 🚀 Guia de Integração Frontend - Sistema de Autenticação

## 📋 Visão Geral

Este guia documenta as correções necessárias para o frontend integrar corretamente com o sistema de autenticação multi-tenant do backend.

## 🔧 Problemas Identificados e Soluções

### 1. **Portas dos Serviços**

**❌ Problema**: O frontend estava tentando acessar endpoints na porta errada.

**✅ Solução**: Usar as portas corretas para cada serviço:

```javascript
// Portas corretas dos serviços (implementação atual)
const AUTH_SERVICE_PORT = 3001;    // auth-service
const DRIVERS_PORT = 3002;         // drivers-vehicles-service
const DELIVERIES_PORT = 3003;      // deliveries-routes-service
const RECEIPTS_PORT = 3004;        // receipts-ocr-service
const TRACKING_PORT = 3005;        // tracking-service
const REPORTS_PORT = 3006;         // reports-service
const COMPANIES_PORT = 3007;       // companies-service
```

### 2. **Estrutura de Resposta dos Endpoints**

**❌ Problema**: O frontend estava acessando dados com estrutura incorreta.

**✅ Solução**: Ajustar o acesso aos dados conforme a estrutura real:

```javascript
// ❌ Estrutura incorreta (anterior)
const user = response.data.user;
const token = response.data.token;

// ✅ Estrutura correta (atual)
const user = response.data.data.user;
const token = response.data.data.token;
```

## 🔐 Endpoints de Autenticação

### 1. **Login**
```javascript
// Endpoint: POST http://localhost:3001/api/auth/login
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'joao_motorista',
    password: 'password'
  })
});

const loginData = await loginResponse.json();

// ✅ Estrutura correta da resposta:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 16,
      "username": "joao_motorista",
      "email": "joao@idtransportes.com",
      "full_name": "João Motorista",
      "user_type": "DRIVER",
      "company_id": 1,
      "company_name": "ID Transportes",
      "company_domain": "idtransportes"
    }
  }
}

// ✅ Acesso correto aos dados:
const token = loginData.data.token;
const user = loginData.data.user;
```

### 2. **Listar Empresas**
```javascript
// Endpoint: GET http://localhost:3001/api/auth/companies
const companiesResponse = await fetch('http://localhost:3001/api/auth/companies', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const companiesData = await companiesResponse.json();

// ✅ Estrutura correta da resposta:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ID Transportes",
      "domain": "idtransportes",
      "email": "contato@idtransportes.com",
      "subscription_plan": "ENTERPRISE"
    }
  ]
}

// ✅ Acesso correto aos dados:
const companies = companiesData.data;
```

### 3. **Selecionar Empresa**
```javascript
// Endpoint: POST http://localhost:3001/api/auth/select-company
const selectCompanyResponse = await fetch('http://localhost:3001/api/auth/select-company', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    company_id: 1
  })
});

const selectCompanyData = await selectCompanyResponse.json();

// ✅ Estrutura correta da resposta:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 16,
      "username": "joao_motorista",
      "email": "joao@idtransportes.com",
      "full_name": "João Motorista",
      "user_type": "DRIVER",
      "company_id": 1,
      "company_name": "ID Transportes"
    }
  }
}

// ✅ Acesso correto aos dados:
const newToken = selectCompanyData.data.token;
const updatedUser = selectCompanyData.data.user;
```

### 4. **Obter Perfil do Usuário**
```javascript
// Endpoint: GET http://localhost:3001/api/auth/profile
const profileResponse = await fetch('http://localhost:3001/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const profileData = await profileResponse.json();

// ✅ Estrutura correta da resposta:
{
  "success": true,
  "data": {
    "id": 16,
    "username": "joao_motorista",
    "email": "joao@idtransportes.com",
    "full_name": "João Motorista",
    "user_type": "DRIVER",
    "company_id": 1,
    "company_name": "ID Transportes"
  }
}

// ✅ Acesso correto aos dados:
const profile = profileData.data;
```

## 🛠️ Implementação no Frontend

### 1. **Configuração de URLs Base**
```javascript
// config/api.js
export const API_BASE_URLS = {
  AUTH_SERVICE: 'http://localhost:3001',
  DRIVERS: 'http://localhost:3002',
  DELIVERIES: 'http://localhost:3003',
  RECEIPTS: 'http://localhost:3004',
  TRACKING: 'http://localhost:3005',
  REPORTS: 'http://localhost:3006',
  COMPANIES: 'http://localhost:3007'
};
```

### 2. **Serviço de Autenticação (Implementação Atual)**
```javascript
// services/api.ts (implementação atual)
class ApiService {
  async login(credentials: { username: string; password: string }) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCompanies() {
    return this.request('/api/auth/companies');
  }

  async selectCompany(companyId: string) {
    return this.request('/api/auth/select-company', {
      method: 'POST',
      body: JSON.stringify({ company_id: companyId }),
    });
  }
}
```

### 3. **Gerenciamento de Estado (Context API - Implementação Atual)**
```javascript
// contexts/AuthContext.tsx (implementação atual)
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [authStep, setAuthStep] = useState<'login' | 'company' | 'complete'>('login');
  const [loading, setLoading] = useState(true);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiService.login(credentials);
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        
        // Mapeamento de roles do backend para o frontend
        const roleMap: Record<string, string> = {
          MASTER: 'MASTER',
          ADMIN: 'ADMIN',
          SUPERVISOR: 'SUPERVISOR',
          OPERATOR: 'OPERATOR',
          DRIVER: 'DRIVER',
          CLIENT: 'CLIENT',
          ADMINISTRADOR: 'ADMIN',
          MOTORISTA: 'DRIVER',
          OPERADOR: 'OPERATOR',
        };
        
        const mappedUser = { 
          ...userData, 
          role: roleMap[userData.user_type] || userData.user_type,
          name: userData.full_name || userData.name
        };
        
        // Store temporary token (without company_id)
        localStorage.setItem('temp_token', token);
        localStorage.setItem('temp_user', JSON.stringify(mappedUser));
        
        setUser(mappedUser);
        setAuthStep('company');
      }
    } catch (error) {
      throw error;
    }
  };

  const selectCompany = async (companyId: string) => {
    try {
      const response = await apiService.selectCompany(companyId);
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        
        const mappedUser = { 
          ...userData, 
          role: roleMap[userData.user_type] || userData.user_type,
          name: userData.full_name || userData.name
        };
        
        // Store final token (with company_id)
        localStorage.setItem('id_transporte_token', token);
        localStorage.setItem('id_transporte_user', JSON.stringify(mappedUser));
        localStorage.removeItem('temp_token');
        localStorage.removeItem('temp_user');
        
        setUser(mappedUser);
        setAuthStep('complete');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('id_transporte_token');
    localStorage.removeItem('id_transporte_user');
    localStorage.removeItem('id_transporte_company');
    localStorage.removeItem('temp_token');
    localStorage.removeItem('temp_user');
    setUser(null);
    setCompany(null);
    setAuthStep('login');
  };
};
```

### 4. **Componente de Login (React/TypeScript)**
```javascript
// pages/Login.tsx (exemplo React/TypeScript)
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({ username, password });
      toast({
        title: "Login realizado com sucesso!",
        description: "Agora selecione sua empresa.",
      });
    } catch (error) {
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : 'Credenciais inválidas',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuário"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};
```

### 5. **Componente de Seleção de Empresa (React/TypeScript)**
```javascript
// components/CompanySelector.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const CompanySelector: React.FC = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const { selectCompany } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await apiService.getCompanies();
      if (response.success && response.data) {
        setCompanies(response.data);
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar empresas",
        description: "Não foi possível carregar a lista de empresas.",
        variant: "destructive",
      });
    }
  };

  const handleSelectCompany = async (companyId: string) => {
    setLoading(true);
    try {
      await selectCompany(companyId);
      toast({
        title: "Empresa selecionada com sucesso!",
        description: "Acesso liberado para o sistema.",
      });
    } catch (error) {
      toast({
        title: "Erro ao selecionar empresa",
        description: error instanceof Error ? error.message : 'Erro ao selecionar empresa',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="company-selector">
      <h2>Selecione sua empresa</h2>
      
      {companies.length === 0 ? (
        <div className="loading">Carregando empresas...</div>
      ) : (
        <div className="companies-list">
          {companies.map((company) => (
            <div
              key={company.id}
              className="company-item"
              onClick={() => handleSelectCompany(company.id)}
            >
              <h3>{company.name}</h3>
              <p>{company.email}</p>
              <span className="plan">{company.subscription_plan}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 🔧 Interceptor para Requisições (Implementação Atual)

```javascript
// services/api.ts (implementação atual)
import { API_BASE_URL } from '@/config/api'; // Importa a nova URL base

class ApiService {
  private getAuthHeader(): Record<string, string> {
    // Primeiro tenta o token final (com company_id)
    let token = localStorage.getItem('id_transporte_token');
    
    // Se não tem token final, tenta o token temporário
    if (!token) {
      token = localStorage.getItem('temp_token');
    }
    
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`; // Usa a URL base única
      
      const headers = {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      };
      
      const response = await fetch(fullUrl, {
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Verificar se a resposta já tem a estrutura esperada
      if (data && typeof data === 'object' && 'success' in data) {
        return data as ApiResponse<T>;
      }
      
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão',
      };
    }
  }
}
```

## 🚨 Checklist de Correções

### ✅ Para Implementar:

1. **Corrigir URLs dos endpoints**:
   - Login: `http://localhost:3001/api/auth/login`
   - Companies: `http://localhost:3001/api/auth/companies`
   - Select Company: `http://localhost:3001/api/auth/select-company`
   - Profile: `http://localhost:3001/api/auth/profile`

2. **Ajustar estrutura de dados**:
   - Usar `response.data.data.user` em vez de `response.data.user`
   - Usar `response.data.data.token` em vez de `response.data.token`
   - Usar `response.data.data` para arrays de empresas

3. **Implementar gerenciamento de estado**:
   - Armazenar token e dados do usuário
   - Gerenciar seleção de empresa
   - Implementar logout

4. **Adicionar interceptors**:
   - Adicionar token automaticamente nas requisições
   - Tratar erros 401 (token expirado)

5. **Implementar fluxo completo**:
   - Login → Seleção de Empresa → Dashboard

### 🔍 Para Testar:

1. **Teste de Login**:
   ```javascript
   // Credenciais de teste
   username: 'joao_motorista'
   password: 'password'
   ```

2. **Verificar estrutura de resposta**:
   - Login deve retornar `{ success: true, data: { token, user } }`
   - Companies deve retornar `{ success: true, data: [...] }`

3. **Testar fluxo completo**:
   - Login → Listar empresas → Selecionar empresa → Acessar perfil

## 📞 Suporte

Se encontrar problemas durante a implementação:

1. Verifique se todos os serviços estão rodando (`npm run dev`)
2. Confirme as portas corretas (3001-3007)
3. Use o arquivo `test_auth_system.js` como referência
4. Verifique a estrutura de resposta no console do navegador

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente (.env)

```env
# URLs dos serviços
VITE_AUTH_API_URL=http://localhost:3001
VITE_DRIVERS_API_URL=http://localhost:3002
VITE_DELIVERIES_API_URL=http://localhost:3003
VITE_RECEIPTS_API_URL=http://localhost:3004
VITE_TRACKING_API_URL=http://localhost:3005
VITE_REPORTS_API_URL=http://localhost:3006
VITE_COMPANIES_API_URL=http://localhost:3007

# Configurações do sistema
VITE_APP_NAME=ID Transporte
VITE_APP_VERSION=2.0.0
```

### Usuários de Teste

- **Master**: `master` / `admin123`
- **Admin Empresa**: `admin` / `admin123` (empresa: idtransportes)
- **Motorista**: `12345678901` / `driver123`
- **Cliente**: `cliente` / `client123`

---

**🎯 Resultado Esperado**: Sistema de autenticação multi-tenant funcionando perfeitamente com login, seleção de empresa e acesso aos dados do usuário. 
