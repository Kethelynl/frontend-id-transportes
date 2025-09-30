import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Receipt {
  id: string;
  delivery_id: string;
  driver_id: string;
  filename: string;
  status: string;
  ocr_data?: Record<string, unknown>;
  validated: boolean;
  created_at: string;
}

const Deliveries: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);
    const response = await apiService.getReceipts();
    if (response.success && response.data) {
      setReceipts(response.data as Receipt[]);
    } else {
      setError(response.error || 'Erro ao carregar canhotos');
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtro simples no frontend (pode ser trocado por filtro na API)
    fetchReceipts();
  };

  const handleProcessOCR = async (id: string, file?: File) => {
    setProcessingId(id);
    const response = await apiService.processReceiptOCR(id, );
    if (response.success) {
      fetchReceipts();
    } else {
      alert(response.error || 'Erro ao processar OCR');
    }
    setProcessingId(null);
  };

  const filteredReceipts = receipts.filter(r =>
    (r.filename && r.filename.toLowerCase().includes(search.toLowerCase())) ||
    (r.delivery_id && r.delivery_id.includes(search)) ||
    (r.driver_id && r.driver_id.includes(search))
  );

  const PAGE_SIZE = 10;
  const exportToCSV = (data: Receipt[], filename: string) => {
    if (!data.length) return;
    const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const [page, setPage] = useState(1);
  const paginatedReceipts = filteredReceipts.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Canhotos de Entregas</h1>
          <form onSubmit={handleSearch} className="flex flex-col gap-2 w-full max-w-md md:flex-row md:gap-2">
            <Input
              placeholder="Buscar por arquivo, entrega ou motorista"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full min-h-[44px] text-base"
            />
            <Button type="submit" className="w-full min-h-[44px] text-base md:w-auto">Buscar</Button>
          </form>
        </div>
        {loading ? (
          <p>Carregando canhotos...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Canhotos</CardTitle>
              <div className="flex gap-2 mt-2">
                <Button type="button" onClick={() => exportToCSV(filteredReceipts, 'canhotos.csv')} className="min-h-[44px] text-base">Exportar CSV</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Arquivo</th>
                      <th className="px-4 py-2 text-left">Entrega</th>
                      <th className="px-4 py-2 text-left">Motorista</th>
                      <th className="px-4 py-2 text-left">Data</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Validado</th>
                      <th className="px-4 py-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReceipts.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-2">{r.id}</td>
                        <td className="px-4 py-2">{r.filename || 'N/A'}</td>
                        <td className="px-4 py-2">{r.delivery_id || 'N/A'}</td>
                        <td className="px-4 py-2">{r.driver_id || 'N/A'}</td>
                        <td className="px-4 py-2">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-2">{r.status}</td>
                        <td className="px-4 py-2">{r.validated ? 'Sim' : 'Não'}</td>
                        <td className="px-4 py-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleProcessOCR(r.id, file);
                              }
                            }}
                            className="mb-2"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessOCR(r.id)}
                            disabled={processingId === r.id}
                            className="min-h-[36px] text-sm"
                          >
                            {processingId === r.id ? 'Processando...' : 'Processar OCR (sem arquivo)'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="min-h-[44px] text-base">Anterior</Button>
                <span>Página {page} de {Math.ceil(filteredReceipts.length / PAGE_SIZE)}</span>
                <Button disabled={page === Math.ceil(filteredReceipts.length / PAGE_SIZE)} onClick={() => setPage(p => p + 1)} className="min-h-[44px] text-base">Próxima</Button>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default Deliveries;