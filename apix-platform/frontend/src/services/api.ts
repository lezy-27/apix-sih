import axios, { AxiosError } from 'axios';
import {
  DailyKPIs,
  HistoryResponse,
  RoutesResponse,
  ElasticityResponse,
  FareListResponse,
  ScrapingStatus,
  DataQuality,
  ScrapingTriggerResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Centralized error handler helper
export const formatApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ detail?: string; message?: string }>;
    if (axiosErr.response?.data?.detail) {
      return axiosErr.response.data.detail;
    }
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
    if (axiosErr.code === 'ECONNABORTED') {
      return 'Request timed out. Please retry.';
    }
    if (!axiosErr.response) {
      return 'Cannot connect to backend server. Ensure FastAPI is running on port 8000.';
    }
    return `Server error (${axiosErr.response.status}): ${axiosErr.message}`;
  }
  return 'An unexpected error occurred.';
};

export const api = {
  // 1. Daily KPIs
  getDailyKPIs: async (): Promise<DailyKPIs> => {
    const { data } = await apiClient.get<DailyKPIs>('/apix/daily');
    return data;
  },

  // 2. Index History
  getIndexHistory: async (days: number = 30): Promise<HistoryResponse> => {
    const { data } = await apiClient.get<HistoryResponse>('/apix/history', {
      params: { days },
    });
    return data;
  },

  // 3. DGCA Routes
  getRoutes: async (): Promise<RoutesResponse> => {
    const { data } = await apiClient.get<RoutesResponse>('/apix/routes');
    return data;
  },

  // 4. Lead-Time Elasticity
  getElasticity: async (route: string = 'ALL'): Promise<ElasticityResponse> => {
    const { data } = await apiClient.get<ElasticityResponse>('/apix/elasticity', {
      params: { route },
    });
    return data;
  },

  // 5. Fare Explorer
  getFares: async (params: {
    page?: number;
    limit?: number;
    airline?: string;
    source?: string;
    route?: string;
    advance_days?: number;
    date?: string;
  }): Promise<FareListResponse> => {
    const cleanedParams: Record<string, any> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        cleanedParams[k] = v;
      }
    });

    const { data } = await apiClient.get<FareListResponse>('/fares', {
      params: cleanedParams,
    });
    return data;
  },

  // 6. Scraping Telemetry & Status
  getScrapingStatus: async (): Promise<ScrapingStatus> => {
    const { data } = await apiClient.get<ScrapingStatus>('/scraping/status');
    return data;
  },

  // 7. Data Quality
  getDataQuality: async (): Promise<DataQuality> => {
    const { data } = await apiClient.get<DataQuality>('/data-quality');
    return data;
  },

  // 8. Run Extraction Trigger
  triggerScrapingRun: async (params?: {
    use_mock?: boolean;
    routes?: string[];
    advance_days?: number[];
  }): Promise<ScrapingTriggerResponse> => {
    const { data } = await apiClient.post<ScrapingTriggerResponse>(
      '/scraping/run',
      params || { use_mock: true }
    );
    return data;
  },
};
