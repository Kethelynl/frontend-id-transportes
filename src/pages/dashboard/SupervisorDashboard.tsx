import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DriverForm } from '@/components/forms/DriverForm';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  MapPin,
  Search,
  FileText,
  Users,
  Activity,
  RefreshCw
} from 'lucide-react';
import { apiService } from '@/services/api';
import { computeMovementStatus, getMovementStatusTw, MOVEMENT_STATUS_LABEL, MovementStatus } from '@/lib/driver-status';
import { useToast } from '@/hooks/use-toast';

type DriverStatusItem = {
  id: string;
  name: string;
  speed: number;
  lastUpdate?: string | null;
  status: MovementStatus;
};

const formatRelativeTime = (timestamp?: string | null) => {
  if (!timestamp) {
    return "Sem atualizacao";
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "Sem atualizacao";
  }

  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 60000) {
    return "Agora mesmo";
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) {
    return `Ha ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Ha ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Ha ${diffDays} d`;
};

export const SupervisorDashboard = () => {
  const [stats, setStats] = useState({
    totalEntregas: 0,
    entregasRealizadas: 0,
    entregasPendentes: 0,
    motoristasAtivos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [driverStatuses, setDriverStatuses] = useState<DriverStatusItem[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadDriverStatuses = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setDriversLoading(true);
      }

      try {
        const response = await apiService.getCurrentLocations();

        if (response.success && Array.isArray(response.data)) {
          const now = Date.now();
          const normalized: DriverStatusItem[] = (response.data as Array<Record<string, unknown>>)
            .map((raw) => {
              const driver = (raw ?? {}) as Record<string, unknown>;
              const id = (driver['driver_id'] ?? driver['id']) as string | number | undefined;

              if (id === undefined || id === null) {
                return null;
              }

              const speedValueRaw = driver['speed'];
              const speedValue = Number(speedValueRaw ?? 0);
              const safeSpeed = Number.isFinite(speedValue) ? speedValue : 0;
              const lastUpdateValue = driver['last_update'];

              return {
                id: String(id),
                name: String(driver['driver_name'] ?? 'Motorista'),
                speed: safeSpeed,
                lastUpdate: typeof lastUpdateValue === 'string' ? lastUpdateValue : null,
                status: computeMovementStatus(
                  {
                    speed: typeof speedValueRaw === 'number' ? speedValueRaw : safeSpeed,
                    last_update: typeof lastUpdateValue === 'string' ? lastUpdateValue : null,
                  },
                  now
                ),
              } as DriverStatusItem | null;
            })
            .filter((item): item is DriverStatusItem => Boolean(item))
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

          setDriverStatuses(normalized);
        }
      } catch (error) {
        console.error('[SupervisorDashboard] Erro ao carregar status dos motoristas', error);
        if (!silent) {
          toast({
            title: 'Falha ao carregar motoristas',
            description: 'Nao foi possivel atualizar o status dos motoristas.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!silent) {
          setDriversLoading(false);
        }
      }
    },
    [toast]
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadDriverStatuses();

    const intervalId = setInterval(() => {
      loadDriverStatuses({ silent: true });
    }, 60000);

    return () => clearInterval(intervalId);
  }, [loadDriverStatuses]);

  const loadDashboardData = async () => {
    try {
      console.log('[SupervisorDashboard] 1. Iniciando busca de dados do dashboard...');
      // CORRE��O: Usa o endpoint correto para buscar os KPIs.
      const response = await apiService.getDashboardKPIs(); 
      console.log('[SupervisorDashboard] 2. Resposta da API recebida:', response);

      if (response.success && response.data) {
        console.log('[SupervisorDashboard] 3. Resposta com sucesso. Dados brutos:', response.data);
        const kpis: any = response.data;
        const todayDeliveries = kpis.today_deliveries ?? kpis.todayDeliveries ?? {
          total: kpis.total_deliveries ?? kpis.totalEntregas ?? 0,
          completed: kpis.completed_deliveries ?? kpis.entregasRealizadas ?? 0,
          pending: kpis.pending_deliveries ?? kpis.entregasPendentes ?? 0,
        };

        const newStats = {
          totalEntregas: Number(todayDeliveries.total ?? 0) || 0,
          entregasRealizadas: Number(todayDeliveries.completed ?? 0) || 0,
          entregasPendentes: Number(todayDeliveries.pending ?? 0) || 0,
          motoristasAtivos: Number(kpis.active_drivers ?? kpis.activeDrivers ?? 0) || 0,
        };
        console.log('[SupervisorDashboard] 4. Novos stats calculados:', newStats);
        setStats(newStats);
      } else {
        console.warn('[SupervisorDashboard] A resposta da API não foi bem-sucedida ou não continha dados.', response);
      }
    } catch (error) {
      console.error('[SupervisorDashboard] 5. Ocorreu um erro na busca de dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive",
      });
    } finally {
      console.log('[SupervisorDashboard] 6. Finalizando carregamento.');
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
    <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Operacional</h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento e controle das operações - {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          <Button className="bg-gradient-primary">
            <Search className="mr-2 h-4 w-4" />
            Buscar Entregas
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-full overflow-x-auto">
          <StatsCard
            title="Total de Entregas"
            value={stats.totalEntregas}
            icon={Package}
            description="Entregas do dia"
            variant="default"
          />
          <StatsCard
            title="Entregas Realizadas"
            value={stats.entregasRealizadas}
            icon={CheckCircle}
            description="Concluídas"
            variant="success"
          />
          <StatsCard
            title="Em Andamento"
            value={stats.entregasPendentes}
            icon={Truck}
            description="Rotas ativas"
            variant="warning"
          />
          <StatsCard
            title="Motoristas Ativos"
            value={stats.motoristasAtivos}
            icon={Users}
            description="Em operaçõo"
            variant="default"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ales de Supervisão
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-12"
                onClick={() => navigate('/dashboard/rastreamento')}
              >
                <MapPin className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Rastreamento de Motoristas</div>
                  <div className="text-xs text-muted-foreground">Monitorar localização em tempo real</div>
                </div>
              </Button>
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
              <Button variant="outline" className="justify-start h-12">
                <FileText className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Relatorios Básicos</div>
                  <div className="text-xs text-muted-foreground">Gerar relatórios operacionais</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-12"
                onClick={() => setShowDriverForm(true)}
              >
                <Users className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Cadastrar Motorista</div>
                  <div className="text-xs text-muted-foreground">Adicionar novo motorista</div>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Driver Status */}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Status dos Motoristas
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadDriverStatuses()}
                disabled={driversLoading}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${driversLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {driversLoading ? (
                <div className="flex h-24 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                </div>
              ) : driverStatuses.length ? (
                <div className="space-y-3">
                  {driverStatuses.map((driver) => {
                    const statusStyles = getMovementStatusTw(driver.status);
                    const safeSpeed = driver.speed < 0 ? 0 : driver.speed;
                    const formattedSpeed = safeSpeed.toFixed(1);
                    return (
                      <div
                        key={driver.id}
                        className={`flex items-center justify-between rounded-lg p-3 ${statusStyles.container}`}
                      >
                        <div>
                          <p className={`text-sm font-semibold ${statusStyles.text}`}>{driver.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(driver.lastUpdate)} - {formattedSpeed} km/h
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${statusStyles.badge}`}
                        >
                          {MOVEMENT_STATUS_LABEL[driver.status]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum motorista com rastreamento ativo no momento.
                </p>
              )}
            </CardContent>
          </Card>
        {/* Alerts and Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas e Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium">Atraso na Rota 004</p>
                  <p className="text-sm text-muted-foreground">Pedro Costa está 30 min atrasado na programação</p>
                </div>
                <span className="text-xs text-muted-foreground">há 15 min</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-danger/5 border border-danger/20">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <div className="flex-1">
                  <p className="font-medium">Entrega com problema</p>
                  <p className="text-sm text-muted-foreground">NF 98765 - Destinatário ausente</p>
                </div>
                <span className="text-xs text-muted-foreground">há 32 min</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Meta diária atingida</p>
                  <p className="text-sm text-muted-foreground">85% das entregas já foram concluídas</p>
                </div>
                <span className="text-xs text-muted-foreground">há 1h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <DriverForm 
        open={showDriverForm}
        onOpenChange={setShowDriverForm}
        onSuccess={() => {
          toast({
            title: "Sucesso",
            description: "Motorista cadastrado com sucesso!",
          });
          // Recarregar dados se necess�rio
          loadDashboardData();
        }}
      />
    </div>
  );
};


