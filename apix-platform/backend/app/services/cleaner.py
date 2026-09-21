import logging
from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
from app.config import settings

logger = logging.getLogger("apix.cleaner")

class DataCleaner:
    def __init__(self, mad_threshold: float = settings.MAD_THRESHOLD):
        self.mad_threshold = mad_threshold

    def calculate_net_consumer_fare(self, base_fare: float, taxes_udf: float) -> float:
        """
        Net consumer fare = base_fare + taxes_udf.
        (Preserves DGCA/APIx passenger ticket outlay excluding optional ancillaries/convenience charge).
        """
        return round(float(base_fare) + float(taxes_udf), 2)

    def normalize_route(self, origin: str, destination: str) -> str:
        """
        Generate normalized route format: ORIGIN-DESTINATION (e.g. DEL-BOM).
        """
        return f"{origin.strip().upper()}-{destination.strip().upper()}"

    def deduplicate(self, records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], int]:
        """
        Deduplicate records based on:
        (origin, destination, departure_date, advance_days, carrier, flight_number).
        Keeps the latest entry if timestamp is available, or lowest fare.
        """
        if not records:
            return [], 0

        df = pd.DataFrame(records)
        initial_count = len(df)

        dedup_keys = ["origin", "destination", "departure_date", "advance_days", "carrier", "flight_number"]
        # Ensure dedup keys exist
        existing_keys = [k for k in dedup_keys if k in df.columns]

        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df = df.sort_values(by="timestamp", ascending=False)
        
        df_dedup = df.drop_duplicates(subset=existing_keys, keep="first")
        duplicates_removed = initial_count - len(df_dedup)

        return df_dedup.to_dict(orient="records"), duplicates_removed

    def detect_outliers_mad(
        self,
        records: List[Dict[str, Any]],
        group_by: str = "route",
        fare_col: str = "net_consumer_fare",
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Detect anomalous fares using Modified Z-score / MAD (Median Absolute Deviation):
        M_i = 0.6745 * (x_i - median(x)) / MAD
        where MAD = median(|x_i - median(x)|).
        If |M_i| > mad_threshold, flag as outlier.
        """
        if not records:
            return [], 0

        df = pd.DataFrame(records)
        if fare_col not in df.columns or len(df) < 3:
            # Not enough data points to compute meaningful MAD; mark non-outlier
            df["is_outlier"] = False
            df["mad_zscore"] = 0.0
            return df.to_dict(orient="records"), 0

        df["is_outlier"] = False
        df["mad_zscore"] = 0.0

        outliers_detected = 0

        # Group by route and advance_days for granular, fair outlier detection
        group_cols = [c for c in [group_by, "advance_days"] if c in df.columns]
        if not group_cols:
            group_cols = [group_by] if group_by in df.columns else []

        if group_cols:
            groups = df.groupby(group_cols)
        else:
            groups = [(None, df)]

        result_indices = []

        for _, group in groups:
            indices = group.index
            fares = group[fare_col].values.astype(float)
            n = len(fares)

            if n < 3:
                # Groups with fewer than 3 observations cannot reliably estimate MAD
                df.loc[indices, "is_outlier"] = False
                df.loc[indices, "mad_zscore"] = 0.0
                continue

            med = np.median(fares)
            abs_dev = np.abs(fares - med)
            mad = np.median(abs_dev)

            # Modified Z-scores
            if mad > 0:
                mod_z = 0.6745 * (fares - med) / mad
            else:
                # If MAD == 0, fallback to mean absolute deviation or zero
                mean_dev = np.mean(abs_dev)
                if mean_dev > 0:
                    mod_z = 0.6745 * (fares - med) / mean_dev
                else:
                    mod_z = np.zeros(n)

            is_outlier_mask = np.abs(mod_z) > self.mad_threshold
            df.loc[indices, "mad_zscore"] = np.round(mod_z, 3)
            df.loc[indices, "is_outlier"] = is_outlier_mask

        outliers_detected = int(df["is_outlier"].sum())
        return df.to_dict(orient="records"), outliers_detected

    def clean_fare_batch(self, raw_quotes: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Execute full cleaning pipeline:
        1. Calculate net consumer fare
        2. Normalize route
        3. Deduplicate
        4. Detect MAD outliers
        """
        if not raw_quotes:
            return [], {
                "total_raw": 0,
                "duplicates_removed": 0,
                "outliers_removed": 0,
                "clean_count": 0,
                "quality_score_pct": 100.0,
            }

        processed = []
        for quote in raw_quotes:
            q = dict(quote)
            origin = str(q.get("origin", "")).strip().upper()
            destination = str(q.get("destination", "")).strip().upper()
            q["origin"] = origin
            q["destination"] = destination
            q["route"] = self.normalize_route(origin, destination)
            base_fare = float(q.get("base_fare", 0.0))
            taxes_udf = float(q.get("taxes_udf", 0.0))
            q["net_consumer_fare"] = self.calculate_net_consumer_fare(base_fare, taxes_udf)
            processed.append(q)

        total_raw = len(processed)
        # Step 2: Deduplication
        deduped, dupes_removed = self.deduplicate(processed)

        # Step 3: MAD Outlier Detection
        with_outliers, outliers_removed = self.detect_outliers_mad(deduped)

        clean_count = total_raw - dupes_removed - outliers_removed
        quality_score = round(max(0.0, (clean_count / total_raw) * 100.0), 2) if total_raw > 0 else 100.0

        stats = {
            "total_raw": total_raw,
            "duplicates_removed": dupes_removed,
            "outliers_removed": outliers_removed,
            "clean_count": clean_count,
            "quality_score_pct": quality_score,
        }

        return with_outliers, stats

cleaner = DataCleaner()
