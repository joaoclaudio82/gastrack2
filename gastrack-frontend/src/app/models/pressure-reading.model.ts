/**
 * Represents a pressure reading from an IoT sensor.
 */
export interface PressureReading {
  /** Unique identifier of the IoT device (e.g., esp32 serial) */
  deviceId: string;
  /** Sensor port 1-8 on the ESP32 */
  sensorId?: number | null;
  /** Formatted datetime string (dd/MM/yyyy HH:mm:ss) */
  datetime: string;
  /** Pressure value in bar */
  pressureBar: number;
  /** Analog-to-digital converter raw value */
  adc: number;
  /** Unix timestamp in seconds */
  timestamp: number;
}

/**
 * Statistics calculated from pressure readings.
 */
/**
 * `unknown`: a linha não tem casco conectado, então não há referência de 100%
 * nem volume — nível não é calculável. Não é o mesmo que "vazio".
 */
export type TankStatusLevel = 'full' | 'normal' | 'low' | 'critical' | 'unknown';

export interface TankStatus {
  level: TankStatusLevel;
  label: string;
}

export type ConsumptionTrendDirection = 'up' | 'down' | 'neutral';

export interface ConsumptionComparison {
  previousAverageBarPerHour: number | null;
  deltaPercentage: number | null;
  direction: ConsumptionTrendDirection;
  tooltip: string;
}

export type EstimatedAutonomyState = 'estimating' | 'refilling' | 'stable' | 'insufficient';
export type EstimateConfidenceLevel = 'low' | 'medium' | 'high';

export interface EstimatedAutonomy {
  remainingHours: number | null;
  consumptionLitersPerHour: number | null;
  confidence: EstimateConfidenceLevel | null;
  state: EstimatedAutonomyState;
  label: string;
  tooltip: string;
}

export interface PressureStats {
  /** Total number of readings */
  totalReadings: number;
  /** Average pressure in bar */
  averagePressure: number;
  /** Maximum pressure recorded */
  maxPressure: number;
  /** Minimum pressure recorded */
  minPressure: number;
  /**
   * Litros equivalentes de gás livre pela última leitura.
   * `null` quando a linha não tem casco conectado: sem volume de casco não há
   * como converter bar em litros.
   */
  currentLiters: number | null;
  /** Nível % pela última leitura. `null` sem casco conectado — não há 100% de referência. */
  currentPercentage: number | null;
  /** Estimated average consumption rate for the current period */
  averageConsumptionBarPerHour: number;
  /** Comparison against the previous equivalent period */
  consumptionComparison: ConsumptionComparison;
  /** Estimated remaining autonomy based on recent consumption */
  estimatedAutonomy: EstimatedAutonomy;
  /** Qualitative tank status derived from liters */
  tankStatus: TankStatus;
  /** Most recent reading */
  latestReading: PressureReading | null;
  /** Unique devices count */
  uniqueDevices: number;
}

/**
 * Filter options for pressure readings.
 */
export interface PressureFilters {
  /** Filter by device ID (ESP32 serial) */
  deviceId?: string | undefined;
  /** Filter by sensor port 1-8 */
  sensorId?: number | null;
  /** Start date for time range filter */
  startDate?: Date | undefined;
  /** End date for time range filter */
  endDate?: Date | undefined;
  /** Max number of readings to fetch (0–500, default 300) */
  limit?: number;
}

/**
 * Paginated response from /pressure/readings endpoint.
 */
export interface PaginatedPressureResponse {
  data: PressureReading[];
  pagination: {
    count: number;
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}
