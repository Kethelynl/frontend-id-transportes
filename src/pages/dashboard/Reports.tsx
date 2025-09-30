import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

// CORREÇÃO: A interface foi ajustada para corresponder à resposta da API `getDeliveries`.
interface DeliveryReportItem {
  id: string;
  nf_number: string;
  client_name: string;
  created_at: string;
  status: string;
  updated_at?: string; // Mantido como opcional, pois a ordenação o utiliza
  driver_name?: string;
}

const DeliveriesReportTab = () => {
  const [allDeliveries, setAllDeliveries] = useState<DeliveryReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    const fetchDeliveries = async () => {
      setLoading(true);
      try {
        const response = await apiService.getDeliveries({});
        if (response.success && Array.isArray(response.data)) {
          // A ordenação agora usa 'updated_at' se existir, ou 'created_at' como fallback.
          const sortedData = (response.data as DeliveryReportItem[]).sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
          setAllDeliveries(sortedData);
        } else {
          toast({
            title: 'Erro ao carregar entregas',
            description: response.error || 'Não foi possível buscar os dados.',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        toast({
          title: 'Erro de Conexão',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveries();
  }, [toast]);

  const filteredDeliveries = useMemo(() => {
    if (!searchTerm) return allDeliveries;
    return allDeliveries.filter(delivery =>
      (delivery.nf_number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (delivery.client_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allDeliveries, searchTerm]);

  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);
  const paginatedDeliveries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDeliveries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDeliveries, currentPage]);

  const exportToCSV = () => {
    if (filteredDeliveries.length === 0) {
      toast({ title: "Nenhum dado para exportar." });
      return;
    }
    const headers = ["NF", "Cliente", "Motorista", "Data Atualização", "Status"];
    const csvRows = [headers.join(',')];
    filteredDeliveries.forEach(d => {
      const row = [
        `"${d.nf_number || ''}"`,
        `"${(d.client_name || '').replace(/"/g, '""')}"`,
        `"${d.driver_name || 'N/A'}"`,
        `"${new Date(d.updated_at).toLocaleString('pt-BR')}"`,
        `"${d.status}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_entregas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <Badge className="bg-green-500 hover:bg-green-600 text-white">Realizada</Badge>;
      case 'IN_TRANSIT': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Em Trânsito</Badge>;
      case 'PENDING': return <Badge variant="secondary">Pendente</Badge>;
      case 'REFUSED': case 'CANCELED': return <Badge variant="destructive">Problema</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entregas Realizadas</CardTitle>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
          <div className="relative w-full sm:w-auto sm:flex-grow sm:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por NF, Cliente..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <Button variant="outline" onClick={exportToCSV} disabled={filteredDeliveries.length === 0 || loading}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NF</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : paginatedDeliveries.length > 0 ? (
                paginatedDeliveries.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.nf_number || 'N/A'}</TableCell>
                    <TableCell>{d.client_name || 'N/A'}</TableCell>
                    <TableCell>{new Date(d.updated_at || d.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{getStatusBadge(d.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhum resultado encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages > 0 ? totalPages : 1}
          </span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
            Próxima <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const PlaceholderTab = ({ title }: { title: string }) => (
  <Card>
    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
    <CardContent><p>Este relatório está em desenvolvimento.</p></CardContent>
  </Card>
);

const Reports = () => {
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
      <Tabs defaultValue="deliveries" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="deliveries">Entregas</TabsTrigger>
          <TabsTrigger value="occurrences">Ocorrências</TabsTrigger>
          <TabsTrigger value="receipts">Comprovantes</TabsTrigger>
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
          <TabsTrigger value="client">Cliente</TabsTrigger>
        </TabsList>
        <TabsContent value="deliveries" className="mt-4"><DeliveriesReportTab /></TabsContent>
        <TabsContent value="occurrences" className="mt-4"><PlaceholderTab title="Relatório de Ocorrências" /></TabsContent>
        <TabsContent value="receipts" className="mt-4"><PlaceholderTab title="Relatório de Comprovantes" /></TabsContent>
        <TabsContent value="performance" className="mt-4"><PlaceholderTab title="Relatório de Desempenho" /></TabsContent>
        <TabsContent value="client" className="mt-4"><PlaceholderTab title="Relatório por Cliente" /></TabsContent>
      </Tabs>
    </main>
  );
};

export default Reports;