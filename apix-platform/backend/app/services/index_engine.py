import logging
import math
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd
from app.config import settings

logger = logging.getLogger("apix.index_engine")

class APIxIndexEngine:
    def __init__(
        self,
        route_weights: Optional[Dict[str, float]] = None,
        advance_window_weights: Optional[Dict[int, float]] = None,
        carrier_shares: Optional[Dict[str, float]] = None,
        base_index_value: float = settings.BASE_INDEX_VALUE,
    ):
        self.route_weights = route_weights or settings.ROUTE_WEIGHTS
        self.advance_window_weights = advance_window_weights or settings.ADVANCE_WINDOW_WEIGHTS
        self.carrier_shares = carrier_shares or settings.CARRIER_SHARES
        self.base_index_value = base_index_value

        # Standard baseline reference prices for DGCA routes (benchmarked from Q1 2026 baseline)
        self.route_base_prices: Dict[str, float] = {
            "DEL-BOM": 4850.0,
            "DEL-BLR": 5400.0,
            "BOM-BLR": 3950.0,
            "DEL-CCU": 4750.0,
            "BLR-HYD": 3200.0,
            "MAA-DEL": 5250.0,
        }

    def compute_carrier_geometric_mean(
        self,
        df_route_window: pd.DataFrame,
        fare_col: str = "net_consumer_fare",
    ) -> float:
        """
        Step 1: Calculate carrier-weighted geometric mean for a specific route and booking window.
        P_{r, t} = exp( sum( s_c * ln(P_{r, t, c}) ) / sum(s_c) )
        """
        if df_route_window.empty:
            return 0.0

        carrier_fares: Dict[str, float] = {}
        for carrier, group in df_route_window.groupby("carrier"):
            # Exclude outliers and zero fares
            valid_fares = group[group["is_outlier"] == False][fare_col].values
            if len(valid_fares) == 0:
                valid_fares = group[fare_col].values
            
            positive_fares = valid_fares[valid_fares > 0]
            if len(positive_fares) > 0:
                # Carrier mean fare for this window
                carrier_fares[carrier] = float(np.mean(positive_fares))

        if not carrier_fares:
            return 0.0

        # Compute carrier-weighted geometric mean
        total_weight = 0.0
        weighted_log_sum = 0.0

        for carrier, avg_fare in carrier_fares.items():
            # Get configured share or fallback
            share = self.carrier_shares.get(carrier, 0.05)
            if avg_fare > 0:
                weighted_log_sum += share * math.log(avg_fare)
                total_weight += share

        if total_weight == 0:
            return float(np.mean(list(carrier_fares.values())))

        geom_mean = math.exp(weighted_log_sum / total_weight)
        return round(geom_mean, 2)

    def compute_weighted_route_price(
        self,
        df_route: pd.DataFrame,
        fare_col: str = "net_consumer_fare",
    ) -> Tuple[float, Dict[int, float]]:
        """
        Step 2: Calculate weighted route price using advance-window weights:
        P_r = sum_{t} ( w_t * P_{r, t} )
        Returns overall route price and dictionary of prices per advance window.
        """
        window_prices: Dict[int, float] = {}
        total_window_weight = 0.0
        weighted_sum = 0.0

        for window_days, weight in self.advance_window_weights.items():
            df_window = df_route[df_route["advance_days"] == window_days]
            window_price = self.compute_carrier_geometric_mean(df_window, fare_col=fare_col)

            if window_price > 0:
                window_prices[window_days] = window_price
                weighted_sum += weight * window_price
                total_window_weight += weight
            else:
                # If window missing, record 0.0
                window_prices[window_days] = 0.0

        if total_window_weight > 0:
            route_price = round(weighted_sum / total_window_weight, 2)
        else:
            # Fallback to simple mean if all window filters fail
            valid_vals = df_route[df_route["is_outlier"] == False][fare_col].values
            route_price = round(float(np.mean(valid_vals)), 2) if len(valid_vals) > 0 else 0.0

        return route_price, window_prices

    def compute_route_relative_index(self, route: str, current_price: float) -> float:
        """
        Step 3: Current-to-baseline relative price ratio:
        I_r = (P_r / P_{r, base}) * BASE_INDEX_VALUE
        """
        base_price = self.route_base_prices.get(route, 4500.0)
        if base_price <= 0:
            return self.base_index_value
        return round((current_price / base_price) * self.base_index_value, 2)

    def compute_national_apix(
        self,
        cleaned_fares: List[Dict[str, Any]],
        fare_col: str = "net_consumer_fare",
    ) -> Dict[str, Any]:
        """
        Step 4: Calculate National APIx using DGCA route weights.
        APIx = sum_{r} ( W_r * I_r )
        
        Returns comprehensive breakdown:
        - national_apix
        - overall_avg_fare
        - routes (index, avg_fare, weight, window_breakdown)
        - lead_time_elasticity
        """
        if not cleaned_fares:
            return {
                "national_apix": self.base_index_value,
                "overall_avg_fare": 0.0,
                "routes": {},
                "lead_time_elasticity": {},
            }

        df = pd.DataFrame(cleaned_fares)
        routes_summary: Dict[str, Any] = {}
        weighted_apix_sum = 0.0
        total_route_weight = 0.0

        # Also accumulate lead-time elasticity across all routes
        elasticity_by_window: Dict[int, List[float]] = {w: [] for w in self.advance_window_weights.keys()}

        for route, weight in self.route_weights.items():
            df_route = df[df["route"] == route]
            if df_route.empty:
                # Route not present in batch; use baseline index
                route_price = self.route_base_prices.get(route, 4500.0)
                route_index = self.base_index_value
                window_prices = {w: route_price for w in self.advance_window_weights.keys()}
            else:
                route_price, window_prices = self.compute_weighted_route_price(df_route, fare_col=fare_col)
                if route_price <= 0:
                    route_price = self.route_base_prices.get(route, 4500.0)
                route_index = self.compute_route_relative_index(route, route_price)

            for w, p in window_prices.items():
                if p > 0:
                    elasticity_by_window[w].append(p)

            weighted_apix_sum += weight * route_index
            total_route_weight += weight

            routes_summary[route] = {
                "route": route,
                "weight": weight,
                "route_index": route_index,
                "route_avg_fare": route_price,
                "window_prices": window_prices,
            }

        national_apix = round(weighted_apix_sum / total_route_weight, 2) if total_route_weight > 0 else self.base_index_value

        # Calculate macro lead-time elasticity
        macro_elasticity: Dict[int, float] = {}
        for w, fares in elasticity_by_window.items():
            macro_elasticity[w] = round(float(np.mean(fares)), 2) if fares else 0.0

        valid_fares = df[df["is_outlier"] == False][fare_col].values
        overall_avg_fare = round(float(np.mean(valid_fares)), 2) if len(valid_fares) > 0 else 0.0

        return {
            "national_apix": national_apix,
            "overall_avg_fare": overall_avg_fare,
            "routes": routes_summary,
            "lead_time_elasticity": macro_elasticity,
        }

index_engine = APIxIndexEngine()
