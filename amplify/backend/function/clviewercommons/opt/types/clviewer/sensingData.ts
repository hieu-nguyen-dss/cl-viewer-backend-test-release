export interface Sensing {
  estimatedBehaviorId: string;
  latitude: string;
  longitude: string;
  unixtime: number;
}

export interface SensingData extends Array<Sensing>{}
