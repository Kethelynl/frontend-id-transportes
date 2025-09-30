import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Company } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Activity,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const Companies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    domain: '',
    email: '',
    subscription_plan: 'BASIC',
    max_users: 5,
    max_drivers: 2,
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF'
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      console.log('Carregando empresas...');
      console.log('Usuário atual:', user);
      
      // Verificar se o token está presente
      const token = localStorage.getItem('id_transporte_token');
      if (!token) {
        toast({
          title: "Erro de Autenticação",
          description: "Token não encontrado. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      // Verificar se o token é válido (não expirado)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (payload.exp < currentTime) {
          toast({
            title: "Token Expirado",
            description: "Seu token expirou. Faça login novamente.",
            variant: "destructive",
          });
          // Limpar dados de autenticação
          localStorage.removeItem('id_transporte_token');
          localStorage.removeItem('id_transporte_user');
          localStorage.removeItem('id_transporte_company');
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        toast({
          title: "Token Inválido",
          description: "Token corrompido. Faça login novamente.",
          variant: "destructive",
        });
        // Limpar dados de autenticação
        localStorage.removeItem('id_transporte_token');
        localStorage.removeItem('id_transporte_user');
        localStorage.removeItem('id_transporte_company');
        return;
      }
      
      console.log('Token encontrado:', token.substring(0, 20) + '...');
      
      const response = await apiService.getCompanies();
      console.log('Response companies:', response);
      
      if (response.success) {
        const raw = Array.isArray(response.data) ? response.data : [];
        const normalized: Company[] = raw.map((c: any) => ({
          id: String(c.id),
          name: c.name ?? '',
          domain: c.domain ?? '',
          email: c.email ?? '',
          primary_color: c.primary_color ?? undefined,
          secondary_color: c.secondary_color ?? undefined,
          status: c.status ?? (typeof c.is_active === 'boolean' ? (c.is_active ? 'ACTIVE' : 'INACTIVE') : 'ACTIVE'),
          subscription_plan: c.subscription_plan ?? undefined,
          max_users: typeof c.max_users === 'number' ? c.max_users : undefined,
          max_drivers: typeof c.max_drivers === 'number' ? c.max_drivers : undefined,
          created_at: c.created_at ?? '',
          updated_at: c.updated_at ?? ''
        }));
        setCompanies(normalized);
      } else {
        console.error('Erro ao carregar empresas:', response.error);
        toast({
          title: "Erro",
          description: response.error || "Não foi possível carregar as empresas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    try {
      // Monta o payload esperado pela API (sem campos de UI como cores)
      const payload = {
        name: (formData.name || '').trim(),
        cnpj: (formData.cnpj || '').replace(/\D/g, ''),
        domain: (formData.domain || '').trim(),
        email: (formData.email || '').trim(),
        subscription_plan: formData.subscription_plan || 'BASIC',
        max_users: Number(formData.max_users) || 5,
        max_drivers: Number(formData.max_drivers) || 2,
      };

      const response = await apiService.createCompany(payload);
      if (response.success && response.data) {
        toast({
          title: "Sucesso",
          description: "Empresa criada com sucesso!",
        });
        setShowCreateDialog(false);
        setFormData({
          name: '',
          cnpj: '',
          domain: '',
          email: '',
          subscription_plan: 'BASIC',
          max_users: 5,
          max_drivers: 2,
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF'
        });
        loadCompanies();
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao criar empresa",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar empresa",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCompany = async () => {
    if (!editingCompany) return;
    
    try {
      // Envia apenas campos aceitos pelo endpoint de update
      const payload = {
        name: formData.name ? formData.name.trim() : undefined,
        domain: formData.domain ? formData.domain.trim() : undefined,
        email: formData.email ? formData.email.trim() : undefined,
        // Os demais campos (planos/limites) podem ser adicionados no futuro quando houver UI
      };

      const response = await apiService.updateCompany(editingCompany.id, payload);
      if (response.success && response.data) {
        toast({
          title: "Sucesso",
          description: "Empresa atualizada com sucesso!",
        });
        setEditingCompany(null);
        setFormData({
          name: '',
          cnpj: '',
          domain: '',
          email: '',
          subscription_plan: 'BASIC',
          max_users: 5,
          max_drivers: 2,
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF'
        });
        loadCompanies();
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao atualizar empresa",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar empresa",
        variant: "destructive",
      });
    }
  };


  const openDeleteDialog = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return status === 'ACTIVE' ? (
      <Badge className="bg-green-100 text-green-800">Ativa</Badge>
    ) : (
      <Badge variant="secondary">Inativa</Badge>
    );
  };

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Usuário não autenticado</h3>
              <p className="text-muted-foreground">
                Faça login para acessar esta página.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== 'MASTER') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
              <p className="text-muted-foreground">
                Apenas usuários Master podem acessar esta página.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as empresas do sistema
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
              <DialogDescription>
                Preencha os dados da nova empresa
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome da empresa"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="domain">Domínio</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="empresa1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCompany}>
                Criar Empresa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresas..."
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

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas ({filteredCompanies.length})</CardTitle>
          <CardDescription>
            Lista de todas as empresas cadastradas no sistema
          </CardDescription>
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
                  <TableHead>Empresa</TableHead>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: company.primary_color || '#3B82F6' }}
                        >
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {company.domain}
                      </code>
                    </TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>{getStatusBadge(company.status)}</TableCell>
                    <TableCell>
                      {new Date(company.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCompany(company);
                            setFormData({
                              name: company.name,
                              cnpj: '',
                              domain: company.domain,
                              email: company.email,
                              subscription_plan: 'BASIC',
                              max_users: 5,
                              max_drivers: 2,
                              primary_color: company.primary_color || '#3B82F6',
                              secondary_color: company.secondary_color || '#1E40AF'
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Activity className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDeleteDialog(company)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a empresa "{companyToDelete?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancelar
            </Button>
            
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualize os dados da empresa
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome da Empresa</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-domain">Domínio</Label>
              <Input
                id="edit-domain"
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
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
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingCompany(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCompany}>
              Atualizar Empresa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Companies;