import { Map, Set } from "immutable";
import * as Random from "random-js";
import { Factory } from "rosie";

import { Geo } from "../apis/geography";
import { allChoropleths, allFeatures } from "../mapStyle";
import { GeoId, LenderId } from "../store/Lar/Lookups";
import { SAFE_INIT as uiOnlyInit } from "../store/Lar/UIOnly";

const random = Random();
const randLat = () => random.real(-90, 90);
const randLon = () => random.real(-180, 180);
const randZoom = () => random.integer(1, 14);

export const ViewportFactory = new Factory().attrs({
  latitude: randLat,
  longitude: randLon,
  transitionDuration: () => 0,
  zoom: randZoom,
});

export const WindowFactory = new Factory().attrs({
  height: () => random.integer(300, 2000),
  width: () => random.integer(300, 2000),
});

export const LARPointFactory = new Factory().attrs({
  geoid: () => random.string(15, "0123456789"),
  houseCount: () => random.integer(1, 10000),
  latitude: randLat,
  loanCount: () => random.integer(1, 100),
  longitude: randLon,
})
.attr(
  "normalizedLoans",
  ["houseCount", "loanCount"],
  (houseCount, loanCount) => houseCount ? loanCount / houseCount : 0,
);

export const FiltersFactory = new Factory().attrs({
  county: () => Set([random.string(15, "0123456789")]),
  lender: () => Set([random.string(15, "0123456789")]),
  lienStatus:
    () => Set(random.sample(["1", "2", "3", "4"], random.integer(0, 4))),
  loanPurpose: () => Set(random.sample(["1", "2", "3"], random.integer(0, 3))),
  metro: () => Set([random.string(15, "0123456789")]),
  ownerOccupancy:
    () => Set(random.sample(["1", "2", "3"], random.integer(0, 3))),
  propertyType:
    () => Set(random.sample(["1", "2", "3"], random.integer(0, 3))),
});

export const GeoFactory = new Factory(Geo).attrs({
  maxLat: randLat,
  maxLon: randLon,
  minLat: randLat,
  minLon: randLon,
  name: () => random.string(32),
});

export const LookupsFactory = new Factory().attrs({
  geos: () => Map<GeoId, Geo>(),
  lenders: () => Map<LenderId, string>(),
  years: () => random.sample(
    [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018],
    random.integer(1, 9),
  ),
});

export const PointsFactory = new Factory().attrs({
  raw: () => [],
  scaleFactor: () => random.integer(0, 50),
});

export const LarFactory = new Factory().attrs({
  filters: () => FiltersFactory.build(),
  lookups: () => LookupsFactory.build(),
  points: () => PointsFactory.build(),
  uiOnly: () => ({ ...uiOnlyInit }),
});

export const MapboxFactory = new Factory().attrs({
  choropleth: () => random.pick(allChoropleths.keySeq().toArray()),
  features: () => Set(allFeatures.keySeq().toArray()),
  token: () => random.string(32),
});

export const SidebarFactory = new Factory().attrs({
  activeTabId: () => "layers",
  expanded: () => true,
});

export const StateFactory = new Factory().attrs({
  lar: () => LarFactory.build(),
  mapbox: () => MapboxFactory.build(),
  sidebar: () => SidebarFactory.build(),
  viewport: () => ViewportFactory.build(),
  window: () => WindowFactory.build(),
});
