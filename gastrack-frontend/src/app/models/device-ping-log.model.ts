export interface DevicePingLog {
  readonly id: number;
  readonly serialNumber: string;
  readonly ipAddress: string | null;
  readonly equipmentId: number | null;
  readonly equipmentAssetTag: string | null;
  readonly pingedAt: string;
  readonly hasEquipment: boolean;
}
