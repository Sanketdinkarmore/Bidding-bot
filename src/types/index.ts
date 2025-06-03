// Location and vehicle type interfaces
export interface LocationData {
  id: string;
  name: string;
}

export interface LocationAndVehicleTypeResponse {
  locations: LocationData[];
  vehicleTypes: string[];
}

// Master data interfaces
export interface TableRow {
  id: string;
  routeType: string;
  ftlType: string;
  originBranch: string;
  destinationBranch: string;
  originCity: string;
  destinationCity: string;
  distance: number;
  amount: number;
  name: string;
  number: string;
  type: string;
}

export interface PaginatedResponse {
  data: TableRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  success: boolean;
} 