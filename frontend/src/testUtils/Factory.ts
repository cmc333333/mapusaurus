import { Set } from "immutable";
import * as Random from "random-js";
import { Factory } from "rosie";

import { FilterEntity } from "../store/LARLayer";

const random = Random();
const randLat = () => random.real(-90, 90);
const randLon = () => random.real(-180, 180);
const randZoom = () => random.integer(1, 14);

export const ViewportFactory = new Factory().attrs({
  latitude: randLat,
  longitude: randLon,
  zoom: randZoom,
});

export const LARPointFactory = new Factory().attrs({
  geoid: () => random.string(15, "0123456789"),
  houseCount: () => random.integer(1, 10000),
  latitude: randLat,
  loanCount: () => random.integer(1, 100),
  longitude: randLon,
});

export const CountyFactory = new Factory(FilterEntity).attrs({
  entityType: () => "county",
  id: () => random.string(15, "0123456789"),
  name: () => random.string(32),
});

export const LenderFactory = new Factory(FilterEntity).attrs({
  entityType: () => "lender",
  id: () => random.string(15, "0123456789"),
  name: () => random.string(32),
});

export const MetroFactory = new Factory(FilterEntity).attrs({
  entityType: () => "metro",
  id: () => random.string(15, "0123456789"),
  name: () => random.string(32),
});

export const USStateFactory = new Factory().attrs({
  abbr: () => random.string(2, "ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
  fips: () => random.string(2, "0123456789"),
  name: () => random.string(32),
});

export const LARLayerFactory = new Factory().attrs({
  available: () => ({
    states: () => USStateFactory.buildList(10),
    years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018],
  }),
  filters: () => [CountyFactory.build(), LenderFactory.build()],
  lar: () => [],
  stateFips: () => random.string(2, "0123456789"),
  year: () => random.integer(2010, 2018),
});

export const LARFilterFactory = new Factory().attrs({
  lienStatus:
    () => Set(random.sample(["1", "2", "3", "4"], random.integer(0, 4))),
  loanPurpose:
    () => Set(random.sample(["1", "2", "3", "4"], random.integer(0, 4))),
  ownerOccupancy:
    () => Set(random.sample(["1", "2", "3", "4"], random.integer(0, 4))),
  propertyType:
    () => Set(random.sample(["1", "2", "3", "4"], random.integer(0, 4))),
});

export const MapboxFactory = new Factory().attrs({
  token: () => random.string(32),
  visible: Set<string>(),
});

export const SidebarFactory = new Factory().attrs({
  activeTabId: () => "layers",
  expanded: () => true,
});

export const StateFactory = new Factory().attrs({
  larFilters: () => LARFilterFactory.build(),
  larLayer: () => LARLayerFactory.build(),
  mapbox: () => MapboxFactory.build(),
  sidebar: () => SidebarFactory.build(),
  viewport: () => ViewportFactory.build(),
});
