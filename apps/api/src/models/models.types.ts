export interface ModelRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelDeviceRecord {
  id: string;
  modelId: string;
  name: string;
}

export interface ModelsStorageState {
  models: ModelRecord[];
  devices: ModelDeviceRecord[];
}

export interface ModelListItem extends ModelRecord {
  deviceCount: number;
}
