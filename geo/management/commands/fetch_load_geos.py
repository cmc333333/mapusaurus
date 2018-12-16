import logging
from datetime import date
from functools import partial
from os.path import basename
from typing import Callable, Iterator

import requests
import us
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.gdal.feature import Feature
from django.contrib.gis.gdal.layer import Layer
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.core.management.base import BaseCommand
from tqdm import tqdm

from geo.models import CoreBasedStatisticalArea, County, State, Tract
from mapusaurus.batch_utils import DjangoModel, save_batches
from mapusaurus.fetch_zip import fetch_and_unzip_dir

ZIP_TPL = ('https://www2.census.gov/geo/tiger/TIGER{year}/{shape}/'
           'tl_{year}_{state}_{shape_lower}.zip')
state_tpl = partial(
    ZIP_TPL.format, shape="STATE", state="us", shape_lower="state")
cbsa_tpl = partial(
    ZIP_TPL.format, shape="CBSA", state="us", shape_lower="cbsa")
county_tpl = partial(
    ZIP_TPL.format, shape="COUNTY", state="us", shape_lower="county")
tract_tpl = partial(ZIP_TPL.format, shape="TRACT", shape_lower="tract")
logger = logging.getLogger(__name__)


def parse_layer(file_name: str) -> Layer:
    """Pull single Layer out of DataSource."""
    data_source = DataSource(file_name, encoding='iso-8859-1')
    if data_source.layer_count > 1:
        logger.warning('More than one layer in %s. Using first', file_name)
    return data_source[0]


def load_shapes(url: str, replace: bool, batch_size: int,
                parse_fn: Callable[[Layer], Iterator[DjangoModel]]):
    try:
        with fetch_and_unzip_dir(url) as dir_path:
            shp_name = basename(url)[:-len(".zip")] + ".shp"
            layer = parse_layer(str(dir_path / shp_name))
            models = parse_fn(layer)
            save_batches(models, replace, batch_size=batch_size)
    except requests.exceptions.RequestException:
        logger.exception("Problem retrieving %s", url)


def load_geometry(feature: Feature) -> MultiPolygon:
    geom = GEOSGeometry(feature.geom.wkb).simplify(preserve_topology=True)
    if isinstance(geom, Polygon):
        return MultiPolygon(geom)
    if isinstance(geom, MultiPolygon):
        return geom
    raise ValueError("Invalid geometry")


def parse_cbsas(layer: Layer) -> Iterator[CoreBasedStatisticalArea]:
    for feature in tqdm(layer, desc='CBSAs'):
        model = CoreBasedStatisticalArea(
            name=feature.get("NAME"),
            geom=load_geometry(feature),
            interior_lat=float(feature.get("INTPTLAT")),
            interior_lon=float(feature.get("INTPTLON")),
            geoid=feature.get("GEOID"),
            metro=feature.get("LSAD") == "M1",
        )
        model.autofields()
        model.full_clean(validate_unique=False)
        yield model


def parse_states(layer: Layer, only_states: Iterator[str]) -> Iterator[State]:
    for feature in tqdm(layer, desc='State Shapes'):
        fips = feature.get("GEOID")
        if fips in only_states:
            model = State(
                name=feature.get("NAME"),
                geom=load_geometry(feature),
                interior_lat=float(feature.get("INTPTLAT")),
                interior_lon=float(feature.get("INTPTLON")),
                geoid=fips,
            )
            model.autofields()
            model.full_clean(validate_unique=False)
            yield model


def parse_counties(
        layer: Layer, only_states: Iterator[str]) -> Iterator[County]:
    for feature in tqdm(layer, desc='County Shapes'):
        state_fips = feature.get("STATEFP")
        if state_fips in only_states:
            model = County(
                name=feature.get("NAME"),
                geom=load_geometry(feature),
                interior_lat=float(feature.get("INTPTLAT")),
                interior_lon=float(feature.get("INTPTLON")),
                geoid=feature.get("GEOID"),
                state_id=feature.get("STATEFP"),
                county_only=feature.get("COUNTYFP"),
                cbsa_id=feature.get("CBSAFP") or None,
            )
            model.autofields()
            model.full_clean(exclude=["state", "cbsa"], validate_unique=False)
            yield model


def parse_tracts(layer: Layer, state: us.states.State) -> Iterator[Tract]:
    for feature in tqdm(layer, desc=f'{state.name} Tract Shapes'):
        model = Tract(
            name=feature.get("NAME"),
            geom=load_geometry(feature),
            interior_lat=float(feature.get("INTPTLAT")),
            interior_lon=float(feature.get("INTPTLON")),
            geoid=feature.get("GEOID"),
            county_id=feature.get("STATEFP") + feature.get("COUNTYFP"),
            tract_only=feature.get("TRACTCE"),
        )
        model.autofields()
        model.full_clean(exclude=["county"], validate_unique=False)
        yield model


def default_year() -> int:
    """Try the current year of TIGER files, but use last year if it's not
    published yet."""
    this_year = date.today().year
    response = requests.head(state_tpl(year=this_year))
    if response.status_code == requests.codes.ok:
        return this_year
    else:
        return this_year - 1


class Command(BaseCommand):
    help = "Fetches and loads shape files from TIGER."

    def add_arguments(self, parser):
        parser.add_argument('--year', type=int, default=default_year(),
                            help="TIGER source year")
        choices = us.STATES + us.TERRITORIES
        parser.add_argument(
            "--states", type=us.states.lookup, nargs='*', default=choices,
            choices=choices, help="States to load",
        )
        parser.add_argument("--replace", action="store_true",
                            help="Replace existing records")
        parser.add_argument(
            "--no-states", dest="state_shapes", action="store_false",
            help="Do not load state geos",
        )
        parser.add_argument(
            "--no-cbsas", dest="cbsa_shapes", action="store_false",
            help="Do not load CBSA geos",
        )
        parser.add_argument(
            "--no-counties", dest="county_shapes", action="store_false",
            help="Do not load County geos",
        )
        parser.add_argument(
            "--no-tracts", dest="tract_shapes", action="store_false",
            help="Do not load Tract geos",
        )
        parser.set_defaults(
            state_shapes=True, cbsa_shapes=True, county_shapes=True,
            tract_shapes=True,
        )

    def handle(self, *args, **options):
        year, replace = options["year"], options["replace"]
        relevant_fips = {state.fips for state in options["states"]}

        if options["state_shapes"]:
            load_shapes(state_tpl(year=year), replace, 10,
                        partial(parse_states, only_states=relevant_fips))
        if options["cbsa_shapes"]:
            load_shapes(cbsa_tpl(year=year), replace, 100, parse_cbsas)
        if options["county_shapes"]:
            load_shapes(county_tpl(year=year), replace, 100,
                        partial(parse_counties, only_states=relevant_fips))

        if options["tract_shapes"]:
            for state in tqdm(options["states"], desc="Tracts by State"):
                load_shapes(tract_tpl(year=year, state=state.fips), replace,
                            100, partial(parse_tracts, state=state))
            logger.info("Loaded tracts for %s states", len(options["states"]))
