import pytest
from app.services.cleaner import DataCleaner

def test_calculate_net_consumer_fare():
    cleaner = DataCleaner()
    # Net consumer fare = base_fare + taxes_udf
    net = cleaner.calculate_net_consumer_fare(base_fare=4200.0, taxes_udf=850.50)
    assert net == 5050.50

def test_normalize_route():
    cleaner = DataCleaner()
    assert cleaner.normalize_route("del", "bom") == "DEL-BOM"
    assert cleaner.normalize_route(" blr ", " hyd ") == "BLR-HYD"

def test_deduplicate():
    cleaner = DataCleaner()
    records = [
        {
            "origin": "DEL",
            "destination": "BOM",
            "departure_date": "2026-09-25",
            "advance_days": 7,
            "carrier": "IndiGo",
            "flight_number": "6E-2041",
            "base_fare": 4500.0,
            "timestamp": "2026-09-20T10:00:00",
        },
        {
            "origin": "DEL",
            "destination": "BOM",
            "departure_date": "2026-09-25",
            "advance_days": 7,
            "carrier": "IndiGo",
            "flight_number": "6E-2041",
            "base_fare": 4500.0,
            "timestamp": "2026-09-20T10:05:00",  # Duplicate quote
        },
        {
            "origin": "DEL",
            "destination": "BOM",
            "departure_date": "2026-09-25",
            "advance_days": 7,
            "carrier": "Air India",
            "flight_number": "AI-805",
            "base_fare": 5200.0,
            "timestamp": "2026-09-20T10:00:00",
        },
    ]
    deduped, removed = cleaner.deduplicate(records)
    assert len(deduped) == 2
    assert removed == 1

def test_mad_outlier_detection():
    cleaner = DataCleaner(mad_threshold=3.5)
    # 9 normal fares around 5000 and 1 extreme outlier at 50000
    normal_fares = [4800.0, 4900.0, 5000.0, 5050.0, 5100.0, 4950.0, 5020.0, 4980.0, 5150.0]
    records = []
    for f in normal_fares:
        records.append({
            "route": "DEL-BOM",
            "advance_days": 7,
            "net_consumer_fare": f,
        })
    # Add extreme anomaly
    records.append({
        "route": "DEL-BOM",
        "advance_days": 7,
        "net_consumer_fare": 55000.0,  # 10x outlier
    })

    with_outliers, count = cleaner.detect_outliers_mad(records, group_by="route")
    assert count == 1
    # Check that the 55000 fare is flagged
    outlier_rec = [r for r in with_outliers if r["net_consumer_fare"] == 55000.0][0]
    assert outlier_rec["is_outlier"] is True
    assert abs(outlier_rec["mad_zscore"]) > 3.5
