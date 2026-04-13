export interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeLinkRecord {
  id: string;
  departmentId: string;
  name: string;
}

export interface DeviceLinkRecord {
  id: string;
  departmentId: string;
  name: string;
}

export interface DepartmentsStorageState {
  departments: DepartmentRecord[];
  employees: EmployeeLinkRecord[];
  devices: DeviceLinkRecord[];
}

export interface DepartmentListItem extends DepartmentRecord {
  employeeCount: number;
  deviceCount: number;
}

export interface DepartmentListResponse {
  items: DepartmentListItem[];
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
