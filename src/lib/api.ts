import axios from 'axios';

export interface TableRow {
  id: string;
  challanNo: string;
  dispatchTime: string;
  routeType: string;
  placementSource: string;
  vehicleNo: string;
  ftlType: string;
  originBranch: string;
  destinationBranch: string;
  originCity: string;
  destinationCity: string;
  distance: number;
  amount: number;
  brokerName: string;
  brokerMobile: number;
  brokerPan: string;
  logicalVendor: string;
  gcnos: string;
}

export interface PaginatedResponse {
  data: TableRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  success: boolean;
}

export interface MasterDataFilters {
  search?: string;
  destinationCity?: string;
  vehicleType?: string;
  originCity?: string;
  page?: number;
  limit?: number;
}

export const fetchMasterData = async (filters: MasterDataFilters = {}): Promise<PaginatedResponse> => {
  const {
    search = '',
    destinationCity = '',
    vehicleType = '',
    originCity = '',
    page = 1,
    limit = 10
  } = filters;

  try {
    const response = await axios.get('/api/master', {
      params: { 
        search, 
        destinationCity, 
        vehicleType, 
        originCity, 
        page, 
        limit 
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch master data:', error);
    throw new Error('Failed to fetch master data');
  }
}; 