import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users as UsersIcon,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  UserCheck,
  UserX
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';

export const Users = () => {
  const { toast } = useToast();
  const { user: authUser } = useAuth(); // 🔒 Obter usuário autenticado para verificações de segurança
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Estado para empresas
  const [companies, setCompanies] = useState<Array<{
    id: string;
    name: string;
    domain: string;
    email: string;
    subscription_plan: string;
  }>>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '', // Campo de senha
    role: '',
    cpf: '',
    company_id: '', // Novo campo para empresa
    status: 'ATIVO'
  });

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao carregar usuários",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      console.log('[Users.tsx] 1. Iniciando carregamento de empresas para o formulário...');
      setCompaniesLoading(true);

      // 🔴 PROBLEMA: A chamada `apiService.getCompanies()` aponta para `/api/auth/companies`, que é para o fluxo de login.
      // ✅ SOLUÇÃO: Usar uma função que busca no serviço de gerenciamento de empresas (`/api/companies` na porta 3007).
      // Vamos usar `getManagementCompanies()` que já existe no seu `api.ts` para essa finalidade.
      const response = await apiService.getManagementCompanies();
      console.log('[Users.tsx] 2. Resposta da API de empresas recebida:', response);

      if (response.success && response.data) {
        console.log(`[Users.tsx] 3. Sucesso! ${response.data.length} empresas carregadas.`);
        setCompanies(response.data);
      } else {
        console.error('[Users.tsx] 3. Falha ao carregar empresas. Erro:', response.error);
        toast({
          title: "Erro",
          description: response.error || "Erro ao carregar empresas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[Users.tsx] 4. Ocorreu uma exceção ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas",
        variant: "destructive",
      });
    } finally {
      setCompaniesLoading(false);
    }
  };

  // CORREÇÃO: Vamos criar uma função `getManagementCompanies` em `api.ts` para evitar ambiguidade.
  // Esta é a alteração que você precisa fazer no seu arquivo `src/services/api.ts`
  /*
  // Em src/services/api.ts

  // ... (outros métodos)

  // Função para o fluxo de login (serviço de autenticação)
  async getAuthCompanies(): Promise<ApiResponse<any[]>> {
    return this.request('/api/auth/companies');
  }

  // Função para o gerenciamento de empresas (serviço de empresas)
  async getManagementCompanies(): Promise<ApiResponse<any[]>> {
    return this.request('/api/companies');
  }

  // Função antiga, agora obsoleta para evitar confusão.
  async getCompanies(): Promise<ApiResponse<any[]>> {
    console.warn("A função getCompanies() é ambígua. Use getAuthCompanies() para login ou getManagementCompanies() para gerenciamento.");
    // Por segurança, redireciona para a função de gerenciamento.
    return this.getManagementCompanies();
  }
  */

  const handleCreateUser = async () => {
    try {
      // Validação básica da senha
      if (!formData.password || formData.password.length < 6) {
        toast({
          title: "Erro de Validação",
          description: "A senha deve ter pelo menos 6 caracteres.",
          variant: "destructive",
        });
        return;
      }
      
      // Mapear os campos do formulário para o formato esperado pelo backend
      const normalizedStatus = (formData.status || 'ATIVO').toUpperCase() === 'INATIVO' ? 'INATIVO' : 'ATIVO';

      const userData = {
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email,
        full_name: formData.name, // Mapear 'name' para 'full_name'
        user_type: formData.role, // Mapear 'role' para 'user_type'
        company_id: formData.company_id || undefined,
        cpf: formData.cpf ? formData.cpf.trim() : undefined,
        status: normalizedStatus,
        is_active: normalizedStatus === 'ATIVO'
      };
      
      const response = await apiService.createUser(userData);
      if (response.success && response.data) {
        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso!",
        });
        setShowCreateDialog(false);
        setFormData({
          name: '',
          username: '',
          email: '',
          password: '',
          role: '',
          cpf: '',
          company_id: '',
          status: 'ATIVO'
        });
        loadUsers();
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao criar usuário",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar usuário",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      const normalizedStatus = (formData.status || 'ATIVO').toUpperCase() === 'INATIVO' ? 'INATIVO' : 'ATIVO';
      const updatePayload = {
        email: formData.email,
        full_name: formData.name,
        user_type: formData.role,
        cpf: formData.cpf ? formData.cpf.trim() : undefined,
        status: normalizedStatus,
        is_active: normalizedStatus === 'ATIVO'
      };

      const response = await apiService.updateUser(editingUser.id, updatePayload);
      if (response.success && response.data) {
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!",
        });
        setEditingUser(null);
        setFormData({
          name: '',
          username: '',
          email: '',
          password: '',
          role: '',
          cpf: '',
          company_id: '',
          status: 'ATIVO'
        });
        loadUsers();
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao atualizar usuário",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Confirmação antes de excluir
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir permanentemente o usuário "${userName}"?\n\nEsta ação não pode ser desfeita e o usuário será completamente removido do banco de dados.`
    );
    
    if (!confirmed) return;
    
    try {
      const response = await apiService.deleteUser(userId);
      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Usuário excluído permanentemente do sistema!",
        });
        loadUsers(); // Recarregar a lista de usuários
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao excluir usuário",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name || user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔒 Função para obter tipos de usuário permitidos baseado no perfil do usuário logado
  const getAllowedUserTypes = () => {
    const userRole = authUser?.role || authUser?.user_type;
    
    switch (userRole) {
      case 'MASTER':
        // Master pode criar qualquer tipo de usuário
        return [
          { value: 'ADMIN', label: 'Administrador' },
          { value: 'SUPERVISOR', label: 'Supervisor' },
          { value: 'OPERATOR', label: 'Operador' },
          { value: 'DRIVER', label: 'Motorista' },
          { value: 'CLIENT', label: 'Cliente' }
        ];
      case 'ADMIN':
      case 'ADMINISTRADOR':
        // Admin pode criar: supervisor, operador, motorista e cliente
        return [
          { value: 'SUPERVISOR', label: 'Supervisor' },
          { value: 'OPERATOR', label: 'Operador' },
          { value: 'DRIVER', label: 'Motorista' },
          { value: 'CLIENT', label: 'Cliente' }
        ];
      case 'SUPERVISOR':
        // Supervisor pode criar apenas: operador e motorista
        return [
          { value: 'OPERATOR', label: 'Operador' },
          { value: 'DRIVER', label: 'Motorista' }
        ];
      default:
        // Outros tipos de usuário não podem criar usuários
        return [];
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      'MASTER': 'bg-purple-100 text-purple-800',
      'ADMIN': 'bg-red-100 text-red-800',
      'SUPERVISOR': 'bg-orange-100 text-orange-800',
      'OPERATOR': 'bg-yellow-100 text-yellow-800',
      'DRIVER': 'bg-blue-100 text-blue-800',
      'CLIENT': 'bg-green-100 text-green-800',
      'ADMINISTRADOR': 'bg-red-100 text-red-800',
      'MOTORISTA': 'bg-blue-100 text-blue-800',
      'OPERADOR': 'bg-yellow-100 text-yellow-800',
      'CLIENTE': 'bg-green-100 text-green-800',
    };
    
    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    );
  };

  const getStatusBadge = (status: number | boolean | string | undefined) => {
    const isActive =
      typeof status === 'string'
        ? (() => {
            const s = status.trim().toLowerCase();
            if (s === 'ativo' || s === 'active' || s === '1') return true;
            if (s === 'inativo' || s === 'inactive' || s === '0') return false;
            return Boolean(status);
          })()
        : Boolean(status);
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge variant="secondary">Inativo</Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>
        
        {/* 🔒 Só mostra o botão se o usuário tiver permissão para criar usuários */}
        {getAllowedUserTypes().length > 0 && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Digite o nome de usuário"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Digite o email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Digite a senha (mínimo 6 caracteres)"
                  minLength={6}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Perfil</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* 🔒 Mostra apenas os tipos de usuário permitidos para o usuário logado */}
                    {getAllowedUserTypes().map((userType) => (
                      <SelectItem key={userType.value} value={userType.value}>
                        {userType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cpf">CPF (Opcional)</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                  placeholder="Digite o CPF"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Empresa *</Label>
                <Select 
                  value={formData.company_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, company_id: value }))}
                  disabled={companiesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={companiesLoading ? "Carregando empresas..." : "Selecione a empresa"} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} ({company.domain})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser}>
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                           <UsersIcon className="h-4 w-4 text-primary" />
                         </div>
                        <div>
                          <p className="font-medium">{user.name || user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role || user.user_type)}</TableCell>
                    <TableCell>{getStatusBadge(user.status || user.is_active)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* 🔒 PROTEÇÃO: Ocultar botões de edição/exclusão para usuários MASTER quando o usuário logado não é MASTER */}
                        {!((user.role === 'MASTER' || user.user_type === 'MASTER') && authUser?.user_type !== 'MASTER') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingUser(user);
                                setFormData({
                                  name: user.name || user.full_name,
                                  username: user.username,
                                  email: user.email,
                                  password: '',
                                  role: user.role || user.user_type,
                                  cpf: user.cpf || '',
                                  company_id: (user as any).company_id ? String((user as any).company_id) : '',
                                  status: typeof user.status === 'string' ? user.status : (user.is_active ? 'ATIVO' : 'INATIVO')
                                });
                              }}
                              title={(user.role === 'MASTER' || user.user_type === 'MASTER') ? 'Editar usuário MASTER' : 'Editar usuário'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteUser(user.id, user.name || user.full_name || user.username)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title={(user.role === 'MASTER' || user.user_type === 'MASTER') ? 'Excluir usuário MASTER' : 'Excluir usuário'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {/* Mostrar indicador visual quando as ações estão bloqueadas */}
                        {(user.role === 'MASTER' || user.user_type === 'MASTER') && authUser?.user_type !== 'MASTER' && (
                          <span className="text-xs text-gray-500 italic px-2 py-1 bg-gray-100 rounded">
                            Protegido
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Nome de Usuário</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Perfil</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  {/* 🔒 Mostra apenas os tipos de usuário permitidos para o usuário logado */}
                  {getAllowedUserTypes().map((userType) => (
                    <SelectItem key={userType.value} value={userType.value}>
                      {userType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-cpf">CPF (Opcional)</Label>
              <Input
                id="edit-cpf"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser}>
              Atualizar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;