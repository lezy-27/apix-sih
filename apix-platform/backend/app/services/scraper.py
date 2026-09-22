import abc
import asyncio
from datetime import datetime, timedelta
import logging
import random
import time
from typing import Dict, List, Any, Optional, Tuple
from app.config import settings

logger = logging.getLogger("apix.scraper")

# =====================================================================
# 1. ABSTRACT BASE CLASS
# =====================================================================

class DataSourceAdapter(abc.ABC):
    """Abstract base class for airline and OTA scraping adapters."""

    def __init__(self, source_name: str, source_type: str = "Airline Direct"):
        self.source_name = source_name
        self.source_type = source_type
        self.last_status: str = "Unknown"
        self.last_response_ms: Optional[float] = None
        self.last_quotes_count: int = 0
        self.last_checked: Optional[datetime] = None

    @abc.abstractmethod
    async def scrape_route(
        self, origin: str, destination: str, advance_days: int, departure_date: str
    ) -> List[Dict[str, Any]]:
        """Scrape flight fare quotes for a specific route and departure date."""
        pass

    def get_health(self) -> Dict[str, Any]:
        """Return current health status of this adapter."""
        return {
            "name": self.source_name,
            "source_type": self.source_type,
            "status": self.last_status,
            "last_response_ms": self.last_response_ms,
            "quotes_last_run": self.last_quotes_count,
            "last_checked": self.last_checked.isoformat() if self.last_checked else None,
        }


# =====================================================================
# 2. CURL_CFFI BASE ADAPTER — TLS-Impersonating HTTP Scraper
# =====================================================================

class CurlCffiBaseAdapter(DataSourceAdapter):
    """
    Base adapter using curl_cffi with Chrome TLS fingerprint impersonation.
    Bypasses Cloudflare/Akamai JA3 fingerprinting without a full headless browser.
    """

    def __init__(self, source_name: str, source_type: str = "Airline Direct"):
        super().__init__(source_name=source_name, source_type=source_type)

    def _get_headers(self) -> Dict[str, str]:
        """Return realistic browser headers for the request."""
        return {
            "User-Agent": settings.SCRAPER_USER_AGENT,
            "Accept": "application/json, text/html, */*;q=0.9",
            "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8,hi;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
        }

    async def _fetch_json(self, url: str, headers: Optional[Dict] = None,
                          payload: Optional[Dict] = None, method: str = "GET") -> Tuple[Optional[Dict], float]:
        """
        Execute an HTTP request via curl_cffi with Chrome TLS impersonation.
        Returns (json_response, response_time_ms) or (None, response_time_ms) on failure.
        """
        from curl_cffi.requests import AsyncSession

        req_headers = headers or self._get_headers()
        proxy = settings.PROXY_URL if settings.PROXY_URL else None
        start_time = time.monotonic()

        for attempt in range(settings.SCRAPER_MAX_RETRIES + 1):
            try:
                async with AsyncSession() as session:
                    if method.upper() == "POST":
                        resp = await session.post(
                            url,
                            headers=req_headers,
                            json=payload,
                            impersonate="chrome",
                            timeout=settings.SCRAPER_TIMEOUT_SEC,
                            proxy=proxy,
                        )
                    else:
                        resp = await session.get(
                            url,
                            headers=req_headers,
                            impersonate="chrome",
                            timeout=settings.SCRAPER_TIMEOUT_SEC,
                            proxy=proxy,
                        )

                    elapsed_ms = round((time.monotonic() - start_time) * 1000, 1)

                    if resp.status_code == 200:
                        try:
                            return resp.json(), elapsed_ms
                        except Exception:
                            # Response is not JSON (e.g. HTML challenge/SPA landing page)
                            logger.warning(f"[{self.source_name}] Non-JSON response from {url}")
                            return None, elapsed_ms
                    elif resp.status_code in (400, 401, 403, 404, 405, 410, 429):
                        logger.warning(f"[{self.source_name}] HTTP {resp.status_code} — immediate fail-fast (no retry)")
                        return None, elapsed_ms
                    else:
                        logger.warning(f"[{self.source_name}] HTTP {resp.status_code} from {url}")

            except Exception as e:
                elapsed_ms = round((time.monotonic() - start_time) * 1000, 1)
                logger.warning(f"[{self.source_name}] Request failed (attempt {attempt+1}): {e}")

            # Delay before retry for 5xx/network errors only
            if attempt < settings.SCRAPER_MAX_RETRIES:
                await asyncio.sleep(settings.SCRAPER_DOMAIN_DELAY_SEC)

        elapsed_ms = round((time.monotonic() - start_time) * 1000, 1)
        return None, elapsed_ms

    @abc.abstractmethod
    def _build_search_url(self, origin: str, destination: str, departure_date: str) -> str:
        """Build the search URL for the specific source."""
        pass

    @abc.abstractmethod
    def _parse_response(self, json_data: Dict, origin: str, destination: str,
                        advance_days: int, departure_date: str) -> List[Dict[str, Any]]:
        """Parse the JSON response into standardized fare quote dicts."""
        pass

    async def scrape_route(
        self, origin: str, destination: str, advance_days: int, departure_date: str
    ) -> List[Dict[str, Any]]:
        """Execute scrape: build URL → fetch → parse → return quotes."""
        self.last_checked = datetime.utcnow()

        url = self._build_search_url(origin, destination, departure_date)
        headers = self._get_headers()

        logger.info(f"[{self.source_name}] Scraping {origin}->{destination} T+{advance_days} for {departure_date}")

        json_data, elapsed_ms = await self._fetch_json(url, headers=headers)
        self.last_response_ms = elapsed_ms

        if json_data is not None:
            try:
                quotes = self._parse_response(json_data, origin, destination, advance_days, departure_date)
                self.last_status = "Online"
                self.last_quotes_count += len(quotes)
                logger.info(f"[{self.source_name}] Extracted {len(quotes)} quotes in {elapsed_ms}ms")
                return quotes
            except Exception as e:
                logger.error(f"[{self.source_name}] Parse error: {e}")
                self.last_status = "Error"
        else:
            self.last_status = "Blocked" if elapsed_ms > 1000 else "Timeout"

        # Fallback to synthetic generator if enabled
        if settings.USE_SYNTHETIC_FALLBACK:
            logger.info(f"[{self.source_name}] Falling back to synthetic generator for {origin}-{destination}")
            return self._synthetic_fallback(origin, destination, advance_days, departure_date)

        return []

    def _synthetic_fallback(self, origin: str, destination: str,
                            advance_days: int, departure_date: str) -> List[Dict[str, Any]]:
        """Generate synthetic fare data as fallback when live scraping fails."""
        carriers = self._get_carriers()
        quotes = []
        for carrier in carriers:
            quotes.extend(
                synthetic_generator.generate_route_quotes(
                    source=self.source_name,
                    carrier=carrier,
                    origin=origin,
                    destination=destination,
                    advance_days=advance_days,
                    departure_date=departure_date,
                    count=1,
                )
            )
        return quotes

    def _get_carriers(self) -> List[str]:
        """Return list of carriers this source provides data for."""
        return [self.source_name] if self.source_name in settings.CARRIER_SHARES else list(settings.CARRIER_SHARES.keys())


# =====================================================================
# 3. CONCRETE SCRAPER ADAPTERS (curl_cffi)
# =====================================================================

class MakeMyTripScraper(CurlCffiBaseAdapter):
    """
    MakeMyTrip OTA scraper.
    Targets MMT's internal flight search API that returns multi-carrier results.
    """
    def __init__(self):
        super().__init__(source_name="MakeMyTrip", source_type="OTA Aggregator")

    def _build_search_url(self, origin: str, destination: str, departure_date: str) -> str:
        # MMT internal search API endpoint
        return (
            f"https://www.makemytrip.com/flights/search/api?"
            f"from={origin}&to={destination}&date={departure_date}"
            f"&class=E&adults=1&childs=0&infants=0&tripType=O"
        )

    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        headers.update({
            "Referer": "https://www.makemytrip.com/flights/",
            "Origin": "https://www.makemytrip.com",
            "X-Requested-With": "XMLHttpRequest",
        })
        return headers

    def _parse_response(self, json_data: Dict, origin: str, destination: str,
                        advance_days: int, departure_date: str) -> List[Dict[str, Any]]:
        quotes = []
        # Navigate MMT JSON structure to extract flight data
        flights = []

        # MMT response varies — try common structures
        if isinstance(json_data, dict):
            # Try nested structure
            flights = json_data.get("searchResult", {}).get("tripInfos", {}).get("ONWARD", [])
            if not flights:
                flights = json_data.get("data", {}).get("flights", [])
            if not flights:
                flights = json_data.get("flights", [])

        for flight in flights:
            try:
                # Extract from MMT structure
                segments = flight.get("sI", []) or flight.get("segments", [])
                fare_info = flight.get("totalPriceList", [{}])[0] if flight.get("totalPriceList") else flight.get("fare", {})

                if segments and fare_info:
                    seg = segments[0] if isinstance(segments, list) else segments
                    airline_info = seg.get("fD", {}).get("aI", {}) or seg.get("airline", {})
                    carrier = airline_info.get("name", "Unknown")
                    flight_no = f"{airline_info.get('code', 'XX')}-{seg.get('fD', {}).get('fN', seg.get('flightNumber', '000'))}"

                    # Fare breakdown
                    if isinstance(fare_info, dict):
                        fd = fare_info.get("fd", fare_info)
                        total = fd.get("totalFare", fd.get("total", 0))
                        base = fd.get("baseFare", fd.get("base", total * 0.75))
                        taxes = total - base if total > base else fd.get("tax", total * 0.20)
                    else:
                        total = float(fare_info)
                        base = total * 0.78
                        taxes = total - base

                    if total > 0:
                        quotes.append(self._make_quote(
                            carrier=carrier, flight_number=flight_no,
                            origin=origin, destination=destination,
                            base_fare=base, taxes_udf=taxes, total_fare=total,
                            advance_days=advance_days, departure_date=departure_date,
                        ))
            except Exception as e:
                logger.debug(f"[MakeMyTrip] Skipping flight parse: {e}")
                continue

        return quotes

    def _make_quote(self, **kwargs) -> Dict[str, Any]:
        base_fare = round(float(kwargs["base_fare"]), 2)
        taxes_udf = round(float(kwargs["taxes_udf"]), 2)
        total_fare = round(float(kwargs["total_fare"]), 2)
        convenience_charge = round(random.uniform(200, 400), 2)

        return {
            "source": self.source_name,
            "origin": kwargs["origin"],
            "destination": kwargs["destination"],
            "route": f"{kwargs['origin']}-{kwargs['destination']}",
            "departure_date": kwargs["departure_date"],
            "advance_days": kwargs["advance_days"],
            "carrier": kwargs["carrier"],
            "flight_number": kwargs["flight_number"],
            "base_fare": base_fare,
            "taxes_udf": taxes_udf,
            "convenience_charge": convenience_charge,
            "total_fare": total_fare,
            "timestamp": datetime.utcnow().isoformat(),
        }


class EaseMyTripScraper(CurlCffiBaseAdapter):
    """
    EaseMyTrip OTA scraper.
    Targets EMT's search API for multi-carrier fare results.
    """
    def __init__(self):
        super().__init__(source_name="EaseMyTrip", source_type="OTA Aggregator")

    def _build_search_url(self, origin: str, destination: str, departure_date: str) -> str:
        return (
            f"https://www.easemytrip.com/flights/search/api?"
            f"from={origin}&to={destination}&date={departure_date}"
            f"&class=Economy&adults=1&children=0&infants=0"
        )

    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        headers.update({
            "Referer": "https://www.easemytrip.com/flights.html",
            "Origin": "https://www.easemytrip.com",
        })
        return headers

    def _parse_response(self, json_data: Dict, origin: str, destination: str,
                        advance_days: int, departure_date: str) -> List[Dict[str, Any]]:
        quotes = []
        flights = []

        if isinstance(json_data, dict):
            flights = json_data.get("results", [])
            if not flights:
                flights = json_data.get("data", {}).get("flights", [])
            if not flights:
                flights = json_data.get("flights", [])

        for flight in flights:
            try:
                carrier = flight.get("airlineName", flight.get("airline", "Unknown"))
                code = flight.get("airlineCode", "XX")
                fnum = flight.get("flightNumber", flight.get("fltNo", "000"))
                flight_no = f"{code}-{fnum}"

                fare = flight.get("fare", flight.get("price", {}))
                if isinstance(fare, dict):
                    total = fare.get("totalFare", fare.get("total", 0))
                    base = fare.get("baseFare", fare.get("base", total * 0.78))
                    taxes = fare.get("tax", total - base)
                else:
                    total = float(fare) if fare else 0
                    base = total * 0.78
                    taxes = total - base

                if total > 0:
                    convenience_charge = round(random.uniform(200, 350), 2)
                    quotes.append({
                        "source": self.source_name,
                        "origin": origin,
                        "destination": destination,
                        "route": f"{origin}-{destination}",
                        "departure_date": departure_date,
                        "advance_days": advance_days,
                        "carrier": carrier,
                        "flight_number": flight_no,
                        "base_fare": round(float(base), 2),
                        "taxes_udf": round(float(taxes), 2),
                        "convenience_charge": convenience_charge,
                        "total_fare": round(float(total), 2),
                        "timestamp": datetime.utcnow().isoformat(),
                    })
            except Exception as e:
                logger.debug(f"[EaseMyTrip] Skipping flight: {e}")
                continue

        return quotes


class IndiGoScraper(CurlCffiBaseAdapter):
    """IndiGo airline direct booking API scraper."""
    def __init__(self):
        super().__init__(source_name="IndiGo", source_type="Airline Direct")

    def _build_search_url(self, origin: str, destination: str, departure_date: str) -> str:
        return (
            f"https://www.goindigo.in/api/flight/search?"
            f"origin={origin}&destination={destination}&departDate={departure_date}"
            f"&adults=1&children=0&infants=0&currency=INR"
        )

    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        headers.update({
            "Referer": "https://www.goindigo.in/",
            "Origin": "https://www.goindigo.in",
        })
        return headers

    def _parse_response(self, json_data: Dict, origin: str, destination: str,
                        advance_days: int, departure_date: str) -> List[Dict[str, Any]]:
        quotes = []
        flights = []

        if isinstance(json_data, dict):
            flights = json_data.get("journeys", [])
            if not flights:
                flights = json_data.get("data", {}).get("flights", [])
            if not flights:
                flights = json_data.get("flights", [])

        for flight in flights:
            try:
                fnum = flight.get("flightNumber", flight.get("fltNo", "000"))
                flight_no = f"6E-{fnum}"

                fare = flight.get("fare", flight.get("price", {}))
                if isinstance(fare, dict):
                    total = fare.get("totalFare", fare.get("total", 0))
                    base = fare.get("baseFare", fare.get("base", total * 0.80))
                    taxes = fare.get("taxes", fare.get("tax", total - base))
                else:
                    total = float(fare) if fare else 0
                    base = total * 0.80
                    taxes = total - base

                if total > 0:
                    quotes.append({
                        "source": self.source_name,
                        "origin": origin,
                        "destination": destination,
                        "route": f"{origin}-{destination}",
                        "departure_date": departure_date,
                        "advance_days": advance_days,
                        "carrier": "IndiGo",
                        "flight_number": flight_no,
                        "base_fare": round(float(base), 2),
                        "taxes_udf": round(float(taxes), 2),
                        "convenience_charge": round(random.uniform(250, 399), 2),
                        "total_fare": round(float(total), 2),
                        "timestamp": datetime.utcnow().isoformat(),
                    })
            except Exception as e:
                logger.debug(f"[IndiGo] Skipping flight: {e}")
                continue

        return quotes

    def _get_carriers(self) -> List[str]:
        return ["IndiGo"]


class AirIndiaScraper(CurlCffiBaseAdapter):
    """Air India direct booking API scraper."""
    def __init__(self):
        super().__init__(source_name="Air India", source_type="Airline Direct")

    def _build_search_url(self, origin: str, destination: str, departure_date: str) -> str:
        return (
            f"https://www.airindia.com/api/flights/search?"
            f"from={origin}&to={destination}&date={departure_date}"
            f"&pax=1&cabin=Economy&currency=INR"
        )

    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        headers.update({
            "Referer": "https://www.airindia.com/",
            "Origin": "https://www.airindia.com",
        })
        return headers

    def _parse_response(self, json_data: Dict, origin: str, destination: str,
                        advance_days: int, departure_date: str) -> List[Dict[str, Any]]:
        quotes = []
        flights = []

        if isinstance(json_data, dict):
            flights = json_data.get("flights", [])
            if not flights:
                flights = json_data.get("data", {}).get("results", [])
            if not flights:
                flights = json_data.get("journeys", [])

        for flight in flights:
            try:
                fnum = flight.get("flightNumber", flight.get("number", "000"))
                flight_no = f"AI-{fnum}"

                fare = flight.get("fare", flight.get("pricing", {}))
                if isinstance(fare, dict):
                    total = fare.get("totalFare", fare.get("total", 0))
                    base = fare.get("baseFare", fare.get("base", total * 0.76))
                    taxes = fare.get("taxes", total - base)
                else:
                    total = float(fare) if fare else 0
                    base = total * 0.76
                    taxes = total - base

                if total > 0:
                    quotes.append({
                        "source": self.source_name,
                        "origin": origin,
                        "destination": destination,
                        "route": f"{origin}-{destination}",
                        "departure_date": departure_date,
                        "advance_days": advance_days,
                        "carrier": "Air India",
                        "flight_number": flight_no,
                        "base_fare": round(float(base), 2),
                        "taxes_udf": round(float(taxes), 2),
                        "convenience_charge": round(random.uniform(300, 450), 2),
                        "total_fare": round(float(total), 2),
                        "timestamp": datetime.utcnow().isoformat(),
                    })
            except Exception as e:
                logger.debug(f"[Air India] Skipping flight: {e}")
                continue

        return quotes

    def _get_carriers(self) -> List[str]:
        return ["Air India"]


class SpiceJetScraper(CurlCffiBaseAdapter):
    """SpiceJet airline direct booking API scraper."""
    def __init__(self):
        super().__init__(source_name="SpiceJet", source_type="Airline Direct")

    def _build_search_url(self, origin: str, destination: str, departure_date: str) -> str:
        return (
            f"https://www.spicejet.com/api/v1/flights?"
            f"origin={origin}&destination={destination}&date={departure_date}"
            f"&adults=1&currency=INR"
        )

    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        headers.update({
            "Referer": "https://www.spicejet.com/",
            "Origin": "https://www.spicejet.com",
        })
        return headers

    def _parse_response(self, json_data: Dict, origin: str, destination: str,
                        advance_days: int, departure_date: str) -> List[Dict[str, Any]]:
        quotes = []
        flights = json_data.get("flights", json_data.get("data", {}).get("flights", []))

        for flight in flights:
            try:
                fnum = flight.get("flightNumber", "000")
                flight_no = f"SG-{fnum}"

                fare = flight.get("fare", flight.get("price", {}))
                if isinstance(fare, dict):
                    total = fare.get("total", fare.get("totalFare", 0))
                    base = fare.get("base", fare.get("baseFare", total * 0.80))
                    taxes = fare.get("tax", total - base)
                else:
                    total = float(fare) if fare else 0
                    base = total * 0.80
                    taxes = total - base

                if total > 0:
                    quotes.append({
                        "source": self.source_name,
                        "origin": origin,
                        "destination": destination,
                        "route": f"{origin}-{destination}",
                        "departure_date": departure_date,
                        "advance_days": advance_days,
                        "carrier": "SpiceJet",
                        "flight_number": flight_no,
                        "base_fare": round(float(base), 2),
                        "taxes_udf": round(float(taxes), 2),
                        "convenience_charge": round(random.uniform(200, 350), 2),
                        "total_fare": round(float(total), 2),
                        "timestamp": datetime.utcnow().isoformat(),
                    })
            except Exception as e:
                logger.debug(f"[SpiceJet] Skipping flight: {e}")
                continue

        return quotes

    def _get_carriers(self) -> List[str]:
        return ["SpiceJet"]


class AkasaScraper(CurlCffiBaseAdapter):
    """Akasa Air direct booking API scraper."""
    def __init__(self):
        super().__init__(source_name="Akasa Air", source_type="Airline Direct")

    def _build_search_url(self, origin: str, destination: str, departure_date: str) -> str:
        return (
            f"https://www.akasaair.com/api/flights/search?"
            f"origin={origin}&destination={destination}&date={departure_date}"
            f"&adults=1&class=Economy"
        )

    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        headers.update({
            "Referer": "https://www.akasaair.com/",
            "Origin": "https://www.akasaair.com",
        })
        return headers

    def _parse_response(self, json_data: Dict, origin: str, destination: str,
                        advance_days: int, departure_date: str) -> List[Dict[str, Any]]:
        quotes = []
        flights = json_data.get("flights", json_data.get("data", {}).get("flights", []))

        for flight in flights:
            try:
                fnum = flight.get("flightNumber", "000")
                flight_no = f"QP-{fnum}"

                fare = flight.get("fare", flight.get("price", {}))
                if isinstance(fare, dict):
                    total = fare.get("total", fare.get("totalFare", 0))
                    base = fare.get("base", fare.get("baseFare", total * 0.82))
                    taxes = fare.get("tax", total - base)
                else:
                    total = float(fare) if fare else 0
                    base = total * 0.82
                    taxes = total - base

                if total > 0:
                    quotes.append({
                        "source": self.source_name,
                        "origin": origin,
                        "destination": destination,
                        "route": f"{origin}-{destination}",
                        "departure_date": departure_date,
                        "advance_days": advance_days,
                        "carrier": "Akasa Air",
                        "flight_number": flight_no,
                        "base_fare": round(float(base), 2),
                        "taxes_udf": round(float(taxes), 2),
                        "convenience_charge": round(random.uniform(200, 350), 2),
                        "total_fare": round(float(total), 2),
                        "timestamp": datetime.utcnow().isoformat(),
                    })
            except Exception as e:
                logger.debug(f"[Akasa Air] Skipping flight: {e}")
                continue

        return quotes

    def _get_carriers(self) -> List[str]:
        return ["Akasa Air"]


# =====================================================================
# 4. REALISTIC SYNTHETIC FARE GENERATOR (Retained as Fallback)
# =====================================================================

class SyntheticFareGenerator:
    """
    Generates statistically accurate, realistic Indian domestic airfare quotes.
    Used as fallback when live OTA scraping is blocked or unavailable.
    Models:
    - DGCA route price levels
    - Advance booking curve (T+1 last minute surge vs T+60 advance discount)
    - Carrier price tiers (Air India full-service vs IndiGo/Akasa LCC)
    - Taxes/UDF and convenience fees
    - Controlled outliers to test the MAD cleaning engine
    """

    ROUTE_BASELINES = {
        "DEL-BOM": 4850.0,
        "DEL-BLR": 5400.0,
        "BOM-BLR": 3950.0,
        "DEL-CCU": 4750.0,
        "BLR-HYD": 3200.0,
        "MAA-DEL": 5250.0,
    }

    # Advance booking multiplier: T+1 is ~1.65x, T+60 is ~0.78x
    ADVANCE_MULTIPLIERS = {
        1: 1.65,
        7: 1.25,
        15: 1.00,
        30: 0.88,
        60: 0.78,
    }

    CARRIER_PREMIUMS = {
        "Air India": 1.12,  # Full service baggage/meal
        "IndiGo": 1.00,     # Baseline LCC
        "Akasa Air": 0.94,  # Competitive discount
        "SpiceJet": 0.93,
    }

    FLIGHT_PREFIXES = {
        "IndiGo": ["6E-2041", "6E-512", "6E-893", "6E-6014", "6E-188"],
        "Air India": ["AI-805", "AI-665", "AI-102", "AI-506", "AI-441"],
        "Akasa Air": ["QP-1342", "QP-1108", "QP-1502", "QP-1620"],
        "SpiceJet": ["SG-8169", "SG-123", "SG-8709", "SG-263"],
    }

    def generate_single_quote(
        self,
        source: str,
        carrier: str,
        origin: str,
        destination: str,
        advance_days: int,
        departure_date: str,
        inject_outlier: bool = False,
    ) -> Dict[str, Any]:
        route = f"{origin}-{destination}"
        base_target = self.ROUTE_BASELINES.get(route, 4500.0)
        advance_mult = self.ADVANCE_MULTIPLIERS.get(advance_days, 1.0)
        carrier_mult = self.CARRIER_PREMIUMS.get(carrier, 1.0)

        # Realistic random variance (+/- 7%)
        noise = random.uniform(0.93, 1.07)
        raw_base = base_target * advance_mult * carrier_mult * noise

        if inject_outlier:
            # Inject extreme price spike (e.g. 3.8x) or glitch (0.15x) to trigger MAD filter
            raw_base *= random.choice([3.8, 0.15])

        base_fare = round(raw_base, 2)
        taxes_udf = round(base_fare * random.uniform(0.14, 0.18) + random.randint(250, 450), 2)
        convenience_charge = round(random.choice([300.0, 350.0, 399.0]), 2)
        total_fare = round(base_fare + taxes_udf + convenience_charge, 2)

        prefixes = self.FLIGHT_PREFIXES.get(carrier, ["FL-100"])
        flight_num = random.choice(prefixes)

        return {
            "source": source,
            "origin": origin,
            "destination": destination,
            "route": route,
            "departure_date": departure_date,
            "advance_days": advance_days,
            "carrier": carrier,
            "flight_number": flight_num,
            "base_fare": base_fare,
            "taxes_udf": taxes_udf,
            "convenience_charge": convenience_charge,
            "total_fare": total_fare,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def generate_route_quotes(
        self,
        source: str,
        carrier: str,
        origin: str,
        destination: str,
        advance_days: int,
        departure_date: str,
        count: int = 1,
    ) -> List[Dict[str, Any]]:
        quotes = []
        for _ in range(count):
            # 1% chance of anomaly for MAD testing
            inject_outlier = random.random() < 0.015
            q = self.generate_single_quote(
                source=source,
                carrier=carrier,
                origin=origin,
                destination=destination,
                advance_days=advance_days,
                departure_date=departure_date,
                inject_outlier=inject_outlier,
            )
            quotes.append(q)
        return quotes


synthetic_generator = SyntheticFareGenerator()

# =====================================================================
# 5. EXTRACTION ENGINE ORCHESTRATOR
# =====================================================================

class ScrapingEngine:
    """Orchestrates async extraction across routes, booking windows, and sources."""

    def __init__(self):
        self.adapters: Dict[str, DataSourceAdapter] = {
            "IndiGo": IndiGoScraper(),
            "Air India": AirIndiaScraper(),
            "Akasa Air": AkasaScraper(),
            "SpiceJet": SpiceJetScraper(),
            "MakeMyTrip": MakeMyTripScraper(),
            "EaseMyTrip": EaseMyTripScraper(),
        }
        self.semaphore = asyncio.Semaphore(settings.SCRAPER_CONCURRENCY)

    def get_all_source_health(self) -> List[Dict[str, Any]]:
        """Return health status for all configured adapters."""
        return [adapter.get_health() for adapter in self.adapters.values()]

    def reset_run_counters(self):
        """Reset per-run quote counts before a new extraction run."""
        for adapter in self.adapters.values():
            adapter.last_quotes_count = 0

    async def execute_full_run(
        self,
        routes: Optional[List[str]] = None,
        advance_windows: Optional[List[int]] = None,
        use_mock: bool = False,
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Execute an ingestion run across all DGCA routes and advance booking windows.
        Returns collected raw quotes and list of any failed sources.
        """
        target_routes = routes or list(settings.ROUTE_WEIGHTS.keys())
        target_windows = advance_windows or list(settings.ADVANCE_WINDOW_WEIGHTS.keys())
        now = datetime.utcnow()

        all_quotes: List[Dict[str, Any]] = []
        failed_sources: List[str] = []

        self.reset_run_counters()

        if use_mock:
            # Fast deterministic synthetic generation (legacy mode)
            for route_str in target_routes:
                origin, destination = route_str.split("-")
                for window in target_windows:
                    dep_date = (now + timedelta(days=window)).strftime("%Y-%m-%d")
                    for source in settings.SOURCES:
                        carriers = [source] if source in settings.CARRIER_SHARES else list(settings.CARRIER_SHARES.keys())
                        for c in carriers:
                            quotes = synthetic_generator.generate_route_quotes(
                                source=source,
                                carrier=c,
                                origin=origin,
                                destination=destination,
                                advance_days=window,
                                departure_date=dep_date,
                                count=1,
                            )
                            all_quotes.extend(quotes)
        else:
            # Execute via curl_cffi adapters with semaphore concurrency control
            tasks = []
            for route_str in target_routes:
                origin, destination = route_str.split("-")
                for window in target_windows:
                    dep_date = (now + timedelta(days=window)).strftime("%Y-%m-%d")
                    for source_name, adapter in self.adapters.items():
                        tasks.append(
                            self._scrape_with_semaphore(adapter, origin, destination, window, dep_date)
                        )

            results = await asyncio.gather(*tasks, return_exceptions=True)
            for res in results:
                if isinstance(res, Exception):
                    logger.error(f"Scraper task failed: {res}")
                elif isinstance(res, list):
                    all_quotes.extend(res)

            # Determine which sources failed entirely
            for source_name, adapter in self.adapters.items():
                if adapter.last_status in ["Blocked", "Timeout", "Error"] and adapter.last_quotes_count == 0:
                    failed_sources.append(source_name)

        return all_quotes, failed_sources

    async def _scrape_with_semaphore(
        self,
        adapter: DataSourceAdapter,
        origin: str,
        destination: str,
        advance_days: int,
        departure_date: str,
    ) -> List[Dict[str, Any]]:
        async with self.semaphore:
            try:
                return await adapter.scrape_route(origin, destination, advance_days, departure_date)
            except Exception as e:
                logger.warning(f"Error scraping {adapter.source_name}: {e}")
                return []


scraping_engine = ScrapingEngine()
