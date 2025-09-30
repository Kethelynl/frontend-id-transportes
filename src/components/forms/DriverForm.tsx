import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface DriverFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface DriverFormData {
  name: string;
  username: string;
  email: string;
  password: string;
  cpf: string;
  cnh: string;
  phone: string;
  company_id: string;
}

export const DriverForm = ({ open, onOpenChange, onSuccess }: DriverFormProps) => {
  const { toast } = useToast();
  const { user: authUser, company: selectedCompany } = useAuth();
  const initialCompanyId = selectedCompany?.id ?? authUser?.company_id ?? '';
  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    username: '',
    email: '',
    password: '',
    cpf: '',
    cnh: '',
    phone: '',
    company_id: initialCompanyId ? String(initialCompanyId) : ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resolvedCompany = selectedCompany?.id ?? authUser?.company_id ?? '';
    const normalized = resolvedCompany ? String(resolvedCompany) : '';
    setFormData(prev => {
      if (normalized && prev.company_id !== normalized) {
        return { ...prev, company_id: normalized };
      }
      if (!normalized && prev.company_id) {
        return { ...prev, company_id: '' };
      }
      return prev;
    });
  }, [selectedCompany?.id, authUser?.company_id]);

  const handleInputChange = (field: keyof DriverFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Nome é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.username.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Nome de usuário é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: "Erro de Validação",
        description: "Email válido é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(formData.password)) {
      toast({
        title: "Erro de Validacao",
        description: "A senha deve ter pelo menos 8 caracteres, incluindo maiuscula, minuscula e numero.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.cpf.trim()) {
      toast({
        title: "Erro de Validação",
        description: "CPF é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.cnh.trim()) {
      toast({
        title: "Erro de Validação",
        description: "CNH é obrigatória.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Telefone é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const resolvedCompanyId = selectedCompany?.id ?? authUser?.company_id ?? formData.company_id;

    if (!resolvedCompanyId) {
      toast({
        title: "Erro",
        description: "Nao foi possivel identificar a empresa para vincular o motorista.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const sanitizedCpf = formData.cpf.replace(/\D/g, '');
    const sanitizedPhone = formData.phone.replace(/[^0-9+]/g, '');
    const sanitizedCnh = formData.cnh.replace(/\D/g, '');

    try {
      const response = await apiService.registerDriverAccount({
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        full_name: formData.name.trim(),
        cpf: sanitizedCpf,
        phone: sanitizedPhone || undefined,
        cnh: sanitizedCnh || undefined,
        company_id: resolvedCompanyId,
      });

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Motorista cadastrado com sucesso!",
        });

        const keepCompanyId = resolvedCompanyId ? String(resolvedCompanyId) : "";

        setFormData({
          name: "",
          username: "",
          email: "",
          password: "",
          cpf: "",
          cnh: "",
          phone: "",
          company_id: keepCompanyId,
        });

        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: "Erro",
          description: response.error || "Erro ao cadastrar motorista",
          variant: "destructive",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao cadastrar motorista";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Motorista</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome completo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Digite o nome de usuário"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Digite o email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Digite a senha (mín. 6 caracteres)"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cnh">CNH *</Label>
              <Input
                id="cnh"
                value={formData.cnh}
                onChange={(e) => handleInputChange('cnh', e.target.value)}
                placeholder="Digite o número da CNH"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar Motorista'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
