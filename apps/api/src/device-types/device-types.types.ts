export interface DeviceTypeRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceRecord {
  id: string;
  typeId: string;
  name: string;
}

export interface DeviceTypesStorageState {
  deviceTypes: DeviceTypeRecord[];
  devices: DeviceRecord[];
}

export interface DeviceTypeListItem extends DeviceTypeRecord {
  deviceCount: number;
}

export interface DeviceTypeListResponse {
  items: DeviceTypeListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    search: string;
  };
}
