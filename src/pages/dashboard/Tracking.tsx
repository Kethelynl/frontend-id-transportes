import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { LatLngTuple } from 'leaflet';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { computeMovementStatus, getMovementStatusHex, MOVEMENT_STATUS_LABEL, MovementStatus } from '@/lib/driver-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Truck } from 'lucide-react';

const DEFAULT_CENTER: LatLngTuple = [-23.55052, -46.633308];

interface DriverLocation {
  driver_id: number;
  driver_name: string;
  latitude: number;
  longitude: number;
  last_update: string;
  status: 'active' | 'inactive';
  movementStatus: MovementStatus;
  speed: number;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || '??';
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const createDriverIcon = (driver: Pick<DriverLocation, 'driver_name' | 'movementStatus'>) => {
  const initials = escapeHtml(getInitials(driver.driver_name));
  const color = getMovementStatusHex(driver.movementStatus);
  const safeName = escapeHtml(driver.driver_name);

  return L.divIcon({
    className: '',
    iconAnchor: [24, 52],
    iconSize: [120, 60],
    popupAnchor: [0, -40],
    html: `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:6px;
        transform:translateY(-8px);
      ">
        <div style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:36px;
          height:36px;
          border-radius:18px;
          background:linear-gradient(135deg,#2563eb,#1d4ed8);
          color:#ffffff;
          font-weight:600;
          box-shadow:0 8px 20px rgba(37,99,235,0.3);
          border:2px solid rgba(255,255,255,0.85);
          font-size:14px;
        ">
          ${initials}
        </div>
        <span style="
          font-size:12px;
          font-weight:600;
          color:${color};
          background:rgba(255,255,255,0.92);
          border-radius:9999px;
          padding:2px 8px;
          border:1px solid ${color};
          box-shadow:0 2px 6px rgba(0,0,0,0.16);
          white-space:nowrap;
        ">
          ${safeName}
        </span>
      </div>
    `,
  });
};

const MapBoundsUpdater: React.FC<{ points: LatLngTuple[] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (!points.length) {
      map.setView(DEFAULT_CENTER, 11);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [points, map]);

  return null;
};

const Tracking = () => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      console.log('[TrackingMap] Solicitando localizacoes atuais...');
      const response = await apiService.getCurrentLocations();
      console.log('[TrackingMap] Resposta da API', response);

      if (response.success && Array.isArray(response.data)) {
        const now = Date.now();

        const parsed: DriverLocation[] = (response.data as Array<Record<string, unknown>>)
          .map((raw) => {
            const driver = raw as Record<string, unknown>;

            const latitudeValue = driver['latitude'];
            const longitudeValue = driver['longitude'];
            const latitude =
              latitudeValue === null || latitudeValue === undefined ? null : Number(latitudeValue);
            const longitude =
              longitudeValue === null || longitudeValue === undefined ? null : Number(longitudeValue);

            if (
              latitude === null ||
              longitude === null ||
              !Number.isFinite(latitude) ||
              !Number.isFinite(longitude)
            ) {
              return null;
            }

            const driverId = driver['driver_id'];
            if (driverId === undefined || driverId === null) {
              return null;
            }

            const status = driver['status'] === 'active' ? 'active' : 'inactive';
            const lastUpdate =
              typeof driver['last_update'] === 'string'
                ? (driver['last_update'] as string)
                : new Date().toISOString();

            const speedValue = Number(driver['speed'] ?? 0);
            const safeSpeed = Number.isFinite(speedValue) ? speedValue : 0;

            const location: DriverLocation = {
              driver_id: Number(driverId),
              driver_name: String(driver['driver_name'] ?? 'Motorista'),
              latitude,
              longitude,
              last_update: lastUpdate,
              status,
              movementStatus: computeMovementStatus(
                { speed: safeSpeed, last_update: lastUpdate },
                now
              ),
              speed: safeSpeed,
            };

            console.log('[TrackingMap] Item recebido', location);
            return location;
          })
          .filter((loc): loc is DriverLocation => Boolean(loc) && loc.status === 'active');

        console.log('[TrackingMap] Itens apos filtro', { quantidade: parsed.length, amostra: parsed.slice(0, 3) });
        setLocations(parsed);
        setError(parsed.length ? null : 'Nenhum motorista com GPS ativo deste periodo.');
      } else {
        setError(response.error || 'Nao foi possivel carregar as localizacoes.');
      }
    } catch (err) {
      console.error('Erro ao buscar localizacoes dos motoristas:', err);
      setError('Nao foi possivel carregar as localizacoes agora.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();

    const intervalId = setInterval(fetchLocations, 60000);
    return () => clearInterval(intervalId);
  }, [fetchLocations]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Aviso sobre o mapa',
        description: error,
        variant: 'default',
        duration: 4000,
      });
    }
  }, [error, toast]);

  const markerPoints = useMemo<LatLngTuple[]>(
    () => locations.map((loc) => [loc.latitude, loc.longitude] as LatLngTuple),
    [locations]
  );

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rastreamento em Tempo Real</h1>
          <p className="text-muted-foreground mt-1">
            Localizações dos motoristas com GPS ativo. Atualiza automaticamente a cada minuto.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Motoristas no Mapa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          <div className="relative">
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={11}
              scrollWheelZoom
              className="h-[600px] w-full rounded-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapBoundsUpdater points={markerPoints} />

              {locations.map((driver) => (
                <Marker
                  key={driver.driver_id}
                  position={[driver.latitude, driver.longitude]}
                  icon={createDriverIcon(driver)}
                >
                  <Popup>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <p className="font-semibold text-foreground">{driver.driver_name}</p>
                      </div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: getMovementStatusHex(driver.movementStatus) }}
                      >
                        {MOVEMENT_STATUS_LABEL[driver.movementStatus]}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Última atualização: {new Date(driver.last_update).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {(isLoading || !locations.length) && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Carregando motoristas...' : 'Nenhum motorista com GPS ativo neste momento.'}
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-3 text-sm text-muted-foreground">{error}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default Tracking;
