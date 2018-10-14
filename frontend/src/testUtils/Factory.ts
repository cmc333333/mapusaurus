import { Map, Set } from "immutable";
import * as Random from "random-js";
import { Factory } from "rosie";

import { SAFE_INIT as larInit } from "../store/LARLayer";

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

export const USStateFactory = new Factory().attrs({
  abbr: () => random.string(2, "ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
  fips: () => random.string(2, "0123456789"),
  name: () => random.string(32),
});

const randDynamicFilter = () => {
  const id = random.string(15, "0123456789");
  return { options: Map([[id, random.string(32)]]), selected: Set(id) };
};

export const LARFiltersFactory = new Factory()
  .option("countySet", randDynamicFilter)
  .option("lenderSet", randDynamicFilter)
  .option("metroSet", randDynamicFilter)
  .option(
    "lienStatusSet",
    () => Set(random.sample(["1", "2", "3", "4"], random.integer(0, 4))),
  )
  .option(
    "loanPurposeSet",
    () => Set(random.sample(["1", "2", "3"], random.integer(0, 3))),
  )
  .option(
    "ownerOccupancySet",
    () => Set(random.sample(["1", "2", "3"], random.integer(0, 3))),
  )
  .option(
    "propertyTypeSet",
    () => Set(random.sample(["1", "2", "3"], random.integer(0, 3))),
  )
  .attr("county", ["countySet"], countySet => ({
    ...larInit.filters.county,
    ...countySet,
  }))
  .attr("lender", ["lenderSet"], lenderSet => ({
    ...larInit.filters.lender,
    ...lenderSet,
  }))
  .attr("metro", ["metroSet"], metroSet => ({
    ...larInit.filters.metro,
    ...metroSet,
  }))
  .attr("lienStatus", ["lienStatusSet"], selected => ({
    ...larInit.filters.lienStatus,
    selected,
  }))
  .attr("loanPurpose", ["loanPurposeSet"], selected => ({
    ...larInit.filters.loanPurpose,
    selected,
  }))
  .attr("ownerOccupancy", ["ownerOccupancySet"], selected => ({
    ...larInit.filters.ownerOccupancy,
    selected,
  }))
  .attr("propertyType", ["propertyTypeSet"], selected => ({
    ...larInit.filters.propertyType,
    selected,
  }));

export const LARLayerFactory = new Factory().attrs({
  available: () => ({
    states: () => USStateFactory.buildList(10),
    years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018],
  }),
  filterGroup: () => "custom",
  filters: () => LARFiltersFactory.build(),
  lar: () => [],
  stateFips: () => random.string(2, "0123456789"),
  year: () => random.integer(2010, 2018),
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
  larLayer: () => LARLayerFactory.build(),
  mapbox: () => MapboxFactory.build(),
  sidebar: () => SidebarFactory.build(),
  viewport: () => ViewportFactory.build(),
});
