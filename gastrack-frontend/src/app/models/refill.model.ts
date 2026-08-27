import type { GasType } from './cylinder-model.model';

/**
 * Troca de botijão registrada pelo cliente.
 * Alinha com RefillRequest do backend.
 */
export interface RefillRequest {
  serialNumber: string;
  cylinderModelId: number;
  /**
   * Qual casco saiu do banco. Com um sensor medindo a saída combinada do manifold,
   * o sistema não deduz isso — quem informa é o cliente. Nulo só quando a linha
   * ainda não tem cilindro (primeira carga).
   */
  outgoingCylinderId: number | null;
}

export enum RefillSource {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

/** Alinha com RefillEventResponse do backend. */
export interface RefillEvent {
  id: number;
  gasPointId: number;
  detectedAt: string | null;
  fromFill: number | null;
  toFill: number | null;
  source: RefillSource;
  cylinderId: number | null;
  cylinderSerialNumber: string | null;
}

export interface RefillGasTypeInfo {
  gasType: GasType | null;
}
