import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, User, Lock } from 'lucide-react';
import { apiService } from '@/services/api';

interface Company {
  // CORREÇÃO: A interface foi ajustada para corresponder aos dados retornados por `getAuthCompanies`.
  // As propriedades `email` e `subscription_plan` não são fornecidas neste endpoint.
  id: string;
  name: string;
  domain: string;
}

const Login: React.FC = () => {
  const { login, selectCompany, authStep, loading } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authStep === 'company') {
      loadCompanies();
    }
  }, [authStep]);

  const loadCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const response = await apiService.getAuthCompanies(); // CORREÇÃO: Usar a função específica para o fluxo de autenticação
      if (response.success && response.data) {
        setCompanies(response.data);
      } else {
        setError('Erro ao carregar empresas');
      }
    } catch (error) {
      setError('Erro ao carregar empresas');
    } finally {
      setCompaniesLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(credentials);
    } catch (error) {
      setError('Credenciais inválidas');
    }
  };

  const handleCompanySelect = async (companyId: string) => {
    try {
      await selectCompany(companyId);
    } catch (error) {
      setError('Erro ao selecionar empresa');
    }
  };

  if (authStep === 'company') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Selecione sua empresa
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Escolha a empresa para a qual você trabalha
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              {companiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Carregando empresas...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                  <Button 
                    onClick={loadCompanies} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      onClick={() => handleCompanySelect(company.id)}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{company.name}</h3>
                          <p className="text-sm text-gray-500">{company.domain}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Selecionar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entrar na sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite suas credenciais para acessar o sistema
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="pl-10"
                    placeholder="Digite seu usuário"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="pl-10"
                    placeholder="Digite sua senha"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;