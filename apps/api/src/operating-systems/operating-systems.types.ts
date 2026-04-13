export interface OperatingSystemRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperatingSystemDeviceRecord {
  id: string;
  operatingSystemId: string;
  name: string;
}

export interface OperatingSystemsStorageState {
  operatingSystems: OperatingSystemRecord[];
  devices: OperatingSystemDeviceRecord[];
}

export interface OperatingSystemListItem extends OperatingSystemRecord {
  deviceCount: number;
}
