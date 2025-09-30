import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, Truck, User, Zap } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Interface para os dados combinados das rotas ativas
interface ActiveRoute {
  id: number;
  driverName: string;
  routeName: string; 
  deliveriesCompleted: number;
  deliveriesTotal: number;
  avatar: string;
  status: string;
}

// --- DADOS DE EXEMPLO (serão substituídos pelos da API) ---



// Dados de exemplo para simular a API - Alertas
const alertsDataExample = [
  {
    id: 1,
    type: 'delay',
    title: 'Atraso na Rota 004',
    message: 'Pedro Costa está 30 min atrasado na programação',
    time: 'há 15 min',
  },
  {
    id: 2,
    type: 'occurrence',
    title: 'Entrega com problema',
    message: 'NF 98765 - Destinatário ausente',
    time: 'há 32 min',
  },
  {
    id: 3,
    type: 'milestone',
    title: 'Meta diária atingida',
    message: '85% das entregas já foram concluídas',
    time: 'há 1 hora',
  },
];

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'delay':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'occurrence':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'milestone':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    default:
      return <Zap className="h-5 w-5 text-gray-500" />;
  }
};


const RealtimeDashboard: React.FC = () => {
  const [activeRoutes, setActiveRoutes] = useState<ActiveRoute[]>([]);
  const [alerts, setAlerts] = useState(alertsDataExample); // Mantendo alertas como exemplo por enquanto
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Buscar localizações e status atuais dos motoristas
        const locationsResponse = await apiService.getCurrentLocations();

        // CORREÇÃO: Usar a função correta 'getDriverPerformanceReports' e passar as datas.
        // 2. Buscar performance (total de entregas) do dia atual.
        const today = new Date().toISOString().split('T')[0];
        const performanceResponse = await apiService.getDriverPerformanceReports({
          start_date: today,
          end_date: today,
        });

        if (locationsResponse.success && performanceResponse.success) {
          const locations = locationsResponse.data || [];
          const performances = performanceResponse.data || [];

          // Mapeia a performance por ID do motorista para fácil acesso
          const performanceMap = new Map(
            performances.map((p: any) => [p.driver_id, p])
          );

          // Combina os dados das duas APIs
          const combinedData: ActiveRoute[] = locations.map((loc: any) => {
            const performance = performanceMap.get(loc.driver_id);
            const driverName = loc.driver_name || 'Motorista Desconhecido';
            
            return {
              id: loc.driver_id,
              driverName: driverName,
              // Usa o nome da entrega atual como nome da rota, ou um padrão
              routeName: loc.current_delivery_client ? `Entrega para ${loc.current_delivery_client}` : 'Rota do Dia',
              deliveriesCompleted: performance?.completed_deliveries ?? 0,
              deliveriesTotal: performance?.total_deliveries ?? 0,
              avatar: driverName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
              status: loc.status || 'inactive',
            };
          });

          setActiveRoutes(combinedData);
        } else {
          // CORREÇÃO: Mensagem de erro mais específica.
          const errorMsg = locationsResponse.error || performanceResponse.error || "Não foi possível carregar os dados das rotas.";
          toast({ title: "Erro ao buscar dados", description: errorMsg, variant: "destructive" });
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard em tempo real:", error);
        toast({ title: "Erro de Conexão", description: "Falha ao conectar com o servidor.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Configura um intervalo para atualizar os dados a cada 60 segundos
    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar o componente
  }, [toast]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Rotas Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Carregando rotas...</div>
          ) : activeRoutes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Nenhuma rota ativa no momento.</div>
          ) : (
            <div className="space-y-6">
              {activeRoutes.map((route) => (
                <div key={route.id} className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">
                      {route.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-foreground">{route.driverName}</p>
                      <p className="text-sm text-muted-foreground">{`${route.deliveriesCompleted}/${route.deliveriesTotal}`}</p>
                    </div>
                    <p className="text-sm text-muted-foreground -mt-1">{route.routeName}</p>
                    <Progress
                      value={route.deliveriesTotal > 0 ? (route.deliveriesCompleted / route.deliveriesTotal) * 100 : 0}
                      className="h-2 mt-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Atualizações em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-4">
                <div className="mt-1">{getAlertIcon(alert.type)}</div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeDashboard;


// Componente para o Dashboard do Motorista (simplificado)
export const DriverRealtimeDashboard: React.FC = () => {
  const { user } = useAuth();
  const driverId = user?.driver_id ?? user?.id;
  const { toast } = useToast();
  const [myRoute, setMyRoute] = useState<ActiveRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !driverId) return;

    const fetchMyRouteData = async () => {
      try {
        setLoading(true);
        // Busca a localização e status de TODOS os motoristas
        const locationsResponse = await apiService.getCurrentLocations();
        // Busca a performance do motorista logado para o dia
        const today = new Date().toISOString().split('T')[0];
        const performanceResponse = await apiService.getDriverPerformanceReports({ start_date: today, end_date: today, driver_id: driverId });

        if (locationsResponse.success && performanceResponse.success) {
          // CORREÇÃO: Filtra a lista de localizações para encontrar o motorista logado
          const allLocations = (locationsResponse.data || []) as any[];
          const myLocation = allLocations.find(loc => String(loc.driver_id) === String(driverId));
          const myPerformance = performanceResponse.data?.[0];

          if (myLocation && myPerformance) {
            const driverName = myLocation.driver_name || user.name || 'Motorista';
            setMyRoute({
              id: myLocation.driver_id,
              driverName: driverName,
              routeName: myLocation.current_delivery_client ? `Entrega para ${myLocation.current_delivery_client}` : 'Rota do Dia',
              deliveriesCompleted: myPerformance.completed_deliveries ?? 0,
              deliveriesTotal: myPerformance.total_deliveries ?? 0,
              avatar: driverName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
              status: myLocation.status || 'inactive',
            });
          }
        } else {
          toast({ title: "Erro ao buscar sua rota", description: "Não foi possível carregar os dados da sua rota.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Erro de Conexão", description: "Falha ao conectar com o servidor.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchMyRouteData();
  }, [driverId, user, toast]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Minha Rota Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Carregando sua rota...</div>
          ) : myRoute ? (
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  <User />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-foreground">{myRoute.routeName}</p>
                  <p className="text-sm text-muted-foreground">{`${myRoute.deliveriesCompleted}/${myRoute.deliveriesTotal} entregas`}</p>
                </div>
                <p className="text-sm text-muted-foreground -mt-1">Progresso do dia</p>
                <Progress
                  value={myRoute.deliveriesTotal > 0 ? (myRoute.deliveriesCompleted / myRoute.deliveriesTotal) * 100 : 0}
                  className="h-2 mt-2"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">Nenhuma rota encontrada para você hoje.</div>
          )}
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Alertas da Rota
          </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground py-4">
            <p>Nenhum alerta no momento.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};