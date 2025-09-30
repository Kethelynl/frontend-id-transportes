export type MovementStatus = "moving" | "stopped";

interface StatusParams {
  speed?: number | null;
  last_update?: string | null;
}

const MOVING_SPEED_THRESHOLD = 3; // km/h considered movement
const STOP_TIME_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

export const MOVEMENT_STATUS_LABEL: Record<MovementStatus, string> = {
  moving: "Ativo",
  stopped: "Parado ha 10+ min",
};

const STATUS_TW_COLORS: Record<MovementStatus, { text: string; badge: string; container: string }> = {
  moving: {
    text: "text-emerald-600",
    badge: "border border-emerald-200 bg-white text-emerald-700",
    container: "border border-emerald-200 bg-emerald-50",
  },
  stopped: {
    text: "text-yellow-600",
    badge: "border border-yellow-200 bg-white text-yellow-700",
    container: "border border-yellow-200 bg-yellow-50",
  },
};

const STATUS_HEX_COLORS: Record<MovementStatus, string> = {
  moving: "#047857",
  stopped: "#b45309",
};

export const computeMovementStatus = (
  { speed, last_update }: StatusParams,
  now: number = Date.now()
): MovementStatus => {
  const normalizedSpeed = Number(speed ?? 0);
  const lastUpdateTime = last_update ? new Date(last_update).getTime() : null;

  if (Number.isFinite(normalizedSpeed) && normalizedSpeed > MOVING_SPEED_THRESHOLD) {
    return "moving";
  }

  if (lastUpdateTime && now - lastUpdateTime >= STOP_TIME_THRESHOLD_MS) {
    return "stopped";
  }

  return "moving";
};

export const getMovementStatusTw = (status: MovementStatus) => STATUS_TW_COLORS[status];

export const getMovementStatusHex = (status: MovementStatus) => STATUS_HEX_COLORS[status];
