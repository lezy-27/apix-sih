export interface DailyKPIs {
  national_apix_index: number;
  daily_change_pct: number;
  monthly_inflation_pct: number;
  quotes_collected_today: number;
  last_updated: string;
  baseline_index: number;
}

export interface HistoryPoint {
  date: string;
  apix_index: number;
  daily_change_pct: number;
  cpi_benchmark: number | null;
  quotes_count: number;
}

export interface HistoryResponse {
  range_days: number;
  points: HistoryPoint[];
}

export interface RouteSummary {
  route: string;
  route_name: string;
  route_index: number;
  weight: number;
  current_avg_fare: number;
  daily_change_pct: number;
  sparkline: number[];
}

export interface RoutesResponse {
  routes: RouteSummary[];
  last_updated: string;
}

export interface AdvanceWindowFare {
  advance_days: number;
  window_label: string; // T+1, T+7, T+15, T+30, T+60
  weight: number;
  avg_fare: number;
  carrier_fares: Record<string, number>;
}

export interface ElasticityResponse {
  route: string;
  overall_avg_fare: number;
  windows: AdvanceWindowFare[];
}

export interface FareQuoteItem {
  id: number;
  carrier: string;
  route: string;
  origin: string;
  destination: string;
  departure_date: string;
  advance_days: number;
  flight_number: string;
  base_fare: number;
  taxes_udf: number;
  net_consumer_fare: number;
  convenience_charge: number;
  total_fare: number;
  source: string;
  timestamp: string;
  is_outlier?: boolean;
}

export interface FareListResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: FareQuoteItem[];
  carriers: string[];
  sources: string[];
  routes: string[];
  advance_windows: number[];
}

export interface ScrapingStatus {
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  last_successful_run: string | null;
  quotes_collected_today: number;
  failed_sources: string[];
  active_run_id: string | null;
  is_mock: boolean;
}

export interface DataQuality {
  quality_score_pct: number;
  total_raw_today: number;
  clean_quotes_today: number;
  duplicates_removed: number;
  outliers_removed: number;
  missing_observations: number;
  last_run_id: string | null;
  last_evaluated: string | null;
}

export interface ScrapingTriggerResponse {
  message: string;
  run_id: string;
  status: string;
  quotes_collected: number;
  cleaned_records: number;
  duplicates_removed: number;
  outliers_detected: number;
}
