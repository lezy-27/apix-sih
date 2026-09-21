import math
import pytest
import pandas as pd
from app.services.index_engine import APIxIndexEngine

def test_carrier_geometric_mean():
    engine = APIxIndexEngine(
        carrier_shares={
            "IndiGo": 0.60,
            "Air India": 0.40,
        }
    )
    # IndiGo fare = 4000, Air India fare = 6000
    # Expected weighted geometric mean: exp(0.60 * ln(4000) + 0.40 * ln(6000))
    expected = math.exp(0.60 * math.log(4000.0) + 0.40 * math.log(6000.0))

    df = pd.DataFrame([
        {"carrier": "IndiGo", "net_consumer_fare": 4000.0, "is_outlier": False},
        {"carrier": "Air India", "net_consumer_fare": 6000.0, "is_outlier": False},
    ])

    result = engine.compute_carrier_geometric_mean(df)
    assert abs(result - expected) < 0.1

def test_advance_window_weighting():
    engine = APIxIndexEngine(
        advance_window_weights={
            1: 0.20,
            7: 0.80,
        },
        carrier_shares={"IndiGo": 1.0},
    )
    # T+1 price = 6000, T+7 price = 4000
    # Expected weighted route price = 0.20 * 6000 + 0.80 * 4000 = 1200 + 3200 = 4400
    df = pd.DataFrame([
        {"carrier": "IndiGo", "advance_days": 1, "net_consumer_fare": 6000.0, "is_outlier": False},
        {"carrier": "IndiGo", "advance_days": 7, "net_consumer_fare": 4000.0, "is_outlier": False},
    ])

    route_price, window_prices = engine.compute_weighted_route_price(df)
    assert route_price == 4400.0
    assert window_prices[1] == 6000.0
    assert window_prices[7] == 4000.0

def test_route_relative_index():
    engine = APIxIndexEngine(base_index_value=100.0)
    # If base price is 4850 and current price is 4850, index should be 100.0
    idx_100 = engine.compute_route_relative_index("DEL-BOM", 4850.0)
    assert idx_100 == 100.0

    # If current price is 10% higher (5335.0), index should be 110.0
    idx_110 = engine.compute_route_relative_index("DEL-BOM", 5335.0)
    assert idx_110 == 110.0

def test_national_apix_calculation():
    engine = APIxIndexEngine(
        route_weights={
            "DEL-BOM": 0.50,
            "DEL-BLR": 0.50,
        },
        advance_window_weights={7: 1.0},
        carrier_shares={"IndiGo": 1.0},
    )
    engine.route_base_prices = {
        "DEL-BOM": 5000.0,
        "DEL-BLR": 5000.0,
    }

    # Route 1: DEL-BOM at 5500 (+10% -> index 110.0)
    # Route 2: DEL-BLR at 4500 (-10% -> index 90.0)
    # National APIx = 0.50 * 110 + 0.50 * 90 = 100.0
    records = [
        {"route": "DEL-BOM", "carrier": "IndiGo", "advance_days": 7, "net_consumer_fare": 5500.0, "is_outlier": False},
        {"route": "DEL-BLR", "carrier": "IndiGo", "advance_days": 7, "net_consumer_fare": 4500.0, "is_outlier": False},
    ]

    result = engine.compute_national_apix(records)
    assert result["national_apix"] == 100.0
    assert result["routes"]["DEL-BOM"]["route_index"] == 110.0
    assert result["routes"]["DEL-BLR"]["route_index"] == 90.0
