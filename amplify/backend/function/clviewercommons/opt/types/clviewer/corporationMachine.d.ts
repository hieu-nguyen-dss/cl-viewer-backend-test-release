export interface CorporationMachine {
  earliestSensingUnixtime: number;
  latestSensingUnixtime: number;
  vehicleId: string;
  corporationId: string;
  sk: string;
  machineId: string;
  pk: string;
  machineColorCode: string;
  machineType: string;
  machineName: string;
}
