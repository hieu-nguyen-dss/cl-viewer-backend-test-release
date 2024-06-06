export interface MachineActivity {
  estimatedBehaviorId: string;
  estimatedBehaviorType: string;
  estimatedTotalSeconds: number;
}

export interface MachineActivities extends Array<MachineActivity>{}
