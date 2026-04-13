export interface BrandRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDeviceRecord {
  id: string;
  brandId: string;
  name: string;
}

export interface BrandsStorageState {
  brands: BrandRecord[];
  devices: BrandDeviceRecord[];
}

export interface BrandListItem extends BrandRecord {
  deviceCount: number;
}
