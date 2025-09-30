import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, User, Calendar, Download } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ReceiptReportItem {
    id: number;
    nf_number: string;
    client_name_extracted: string;
    delivery_date: string;
    driver_name: string;
    receipt_image_url: string;
    receipt_captured_at: string;
}

export const ReceiptsReport = () => {
    const [reportData, setReportData] = useState<ReceiptReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                // Aqui usamos um método que você precisará adicionar no seu apiService
                // Here we use a method you will need to add to your apiService
                const response = await apiService.getReceiptsReport();
                // CORREÇÃO: Garante que response.data seja um array antes de atualizar o estado.
                // FIX: Ensures response.data is an array before updating the state.
                if (response.success && Array.isArray(response.data)) {
                    setReportData(response.data);
                } else if (response.success) {
                    // Se a resposta for bem-sucedida mas não contiver um array, define como vazio.
                    // If the response is successful but does not contain an array, set it as empty.
                    setReportData([]);
                } else {
                    throw new Error(response.error || 'Falha ao carregar relatório');
                }
            } catch (error: any) {
                toast({
                    title: 'Erro ao carregar relatório',
                    description: error.message,
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [toast]);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const exportToCSV = () => {
        if (reportData.length === 0) {
            toast({
                title: "Nenhum dado para exportar",
                description: "O relatório está vazio.",
                variant: "default"
            });
            return;
        }

        const headers = [
            "ID da Entrega",
            "Número NF",
            "Cliente",
            "Motorista",
            "Data da Entrega",
            "Data da Captura do Canhoto",
            "URL da Imagem"
        ];

        const csvRows = [headers.join(',')]; // Linha de cabeçalho

        reportData.forEach(item => {
            const row = [
                item.id,
                `"${item.nf_number}"`,
                `"${(item.client_name_extracted || '').replace(/"/g, '""')}"`,
                `"${(item.driver_name || 'Não atribuído').replace(/"/g, '""')}"`,
                `"${formatDate(item.delivery_date)}"`,
                `"${formatDate(item.receipt_captured_at)}"`,
                `"${item.receipt_image_url}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Adiciona BOM para Excel
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const fileName = `relatorio_canhotos_${new Date().toISOString().split('T')[0]}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="container mx-auto px-4 py-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Relatório de Canhotos Anexados
                        </CardTitle>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={exportToCSV}
                            disabled={loading || reportData.length === 0}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exportar CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center text-gray-500">Carregando relatório...</p>
                    ) : reportData.length === 0 ? (
                        <p className="text-center text-gray-500">Nenhum canhoto encontrado.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nota Fiscal</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Motorista</TableHead>
                                    <TableHead>Data da Entrega</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.nf_number}</TableCell>
                                        <TableCell>{item.client_name_extracted}</TableCell>
                                        <TableCell>{item.driver_name || 'Não atribuído'}</TableCell>
                                        <TableCell>{formatDate(item.delivery_date)}</TableCell>
                                        <TableCell className="text-right">
                                            <a href={item.receipt_image_url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="default" size="sm">Ver Canhoto</Button>
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </main>
    );
};