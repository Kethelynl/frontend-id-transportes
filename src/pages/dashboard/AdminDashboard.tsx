import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  MapPin,
  BarChart3,
  FileText,
  Search // Adicionado para o novo botão
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { DeliveryUpload } from '@/components/delivery/DeliveryUpload';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEntregas: 0,
    entregasRealizadas: 0,
    entregasPendentes: 0,
    motoristasAtivos: 0,
    ocorrencias: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showDeliveryUpload, setShowDeliveryUpload] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('[AdminDashboard] 1. Iniciando busca de dados do dashboard...');
      // CORREÇÃO: Usa o endpoint correto para buscar os KPIs.
      const response = await apiService.getDashboardKPIs();
      console.log('[AdminDashboard] 2. Resposta da API recebida:', response);

      if (response.success && response.data) {
        console.log('[AdminDashboard] 3. Resposta com sucesso. Dados brutos:', response.data);
        const kpis: any = response.data;
        const newStats = {
          totalEntregas: kpis.today_deliveries?.total ?? 0,
          entregasRealizadas: kpis.today_deliveries?.completed ?? 0,
          entregasPendentes: kpis.today_deliveries?.pending ?? 0,
          ocorrencias: kpis.pending_occurrences ?? 0,
          motoristasAtivos: kpis.active_drivers ?? 0, // Adicionado para consistência
        };
        console.log('[AdminDashboard] 4. Novos stats calculados:', newStats);
        setStats(newStats);
      } else {
        console.warn('[AdminDashboard] A resposta da API não foi bem-sucedida ou não continha dados.', response);
      }
    } catch (error) {
      console.error('[AdminDashboard] 5. Ocorreu um erro na busca de dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive",
      });
    } finally {
      console.log('[AdminDashboard] 6. Finalizando carregamento.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    // 1. Layout restaurado: O container principal foi adicionado de volta.
    <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema de entregas - {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button className="bg-gradient-primary" onClick={() => navigate('/dashboard/relatorios')}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Relatórios Completos
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-full overflow-x-auto">
        <StatsCard
          title="Total de Entregas"
          value={stats.totalEntregas}
          icon={Package}
          description="Entregas programadas hoje"
          variant="default"
        />
        <StatsCard
          title="Entregas Realizadas"
          value={stats.entregasRealizadas}
          icon={CheckCircle}
          description="Concluídas com sucesso"
          variant="success"
        />
        <StatsCard
          title="Entregas Pendentes"
          value={stats.entregasPendentes}
          icon={Truck}
          description="Em andamento"
          variant="warning"
        />
        <StatsCard
          title="Ocorrências"
          value={stats.ocorrencias}
          icon={AlertTriangle}
          description="Problemas reportados"
          variant="danger"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="justify-start h-12" onClick={() => navigate('/dashboard/usuarios')}>
              <Users className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Gerenciar Usuários</div>
                <div className="text-xs text-muted-foreground">Cadastrar e editar usuários</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-12" onClick={() => navigate('/dashboard/veiculos')}>
              <Truck className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Cadastrar Veículos</div>
                <div className="text-xs text-muted-foreground">Adicionar novos veículos</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-12" 
              onClick={() => setShowDeliveryUpload(true)}
            >
              <Package className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Nova Entrega</div>
                <div className="text-xs text-muted-foreground">Cadastrar nova entrega</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-12" onClick={() => navigate('/dashboard/rastreamento')}>
              <MapPin className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Rastreamento</div>
                <div className="text-xs text-muted-foreground">Ver localização dos motoristas</div>
              </div>
            </Button>
            {/* Botão adicionado para buscar canhotos */}
            <Button 
              variant="outline" 
              className="justify-start h-12" 
              onClick={() => navigate('/dashboard/receipts-report')}
            >
              <Search className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Buscar Canhotos</div>
                <div className="text-xs text-muted-foreground">Consultar comprovantes de entrega</div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                <div className="w-2 h-2 bg-success rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Entrega realizada</p>
                  <p className="text-xs text-muted-foreground">NF 12345 - Cliente ABC - 14:30</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="w-2 h-2 bg-warning rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Motorista iniciou rota</p>
                  <p className="text-xs text-muted-foreground">João Silva - Rota 001 - 08:00</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Novo canhoto processado</p>
                  <p className="text-xs text-muted-foreground">OCR concluído - NF 54321 - 13:45</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-danger/5 border border-danger/20">
                <div className="w-2 h-2 bg-danger rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ocorrência reportada</p>
                  <p className="text-xs text-muted-foreground">Destinatário ausente - NF 98765 - 12:15</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20">
              <div>
                <p className="font-medium">API de Rastreamento</p>
                <p className="text-sm text-muted-foreground">Operacional</p>
              </div>
              <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20">
              <div>
                <p className="font-medium">Processamento OCR</p>
                <p className="text-sm text-muted-foreground">Operacional</p>
              </div>
              <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20">
              <div>
                <p className="font-medium">Base de Dados</p>
                <p className="text-sm text-muted-foreground">Operacional</p>
              </div>
              <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Funcionalidade corrigida: Modal de Cadastro de Entrega com seleção de motorista habilitada. */}
      <DeliveryUpload
        open={showDeliveryUpload}
        onOpenChange={setShowDeliveryUpload}
        allowDriverSelection={true} // Força a exibição da lista de motoristas.
        onSuccess={() => {
          loadDashboardData(); // Recarrega os KPIs do dashboard
          toast({
            title: "Entrega Cadastrada!",
            description: "A nova entrega foi criada e atribuída com sucesso.",
          });
          // Fecha o modal após o sucesso
          setShowDeliveryUpload(false);
        }}
      />
    </div>
  );
};