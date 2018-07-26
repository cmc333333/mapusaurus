import { Set } from "immutable";
import * as Random from "random-js";
import { Factory } from "rosie";

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

export const GeoFactory = new Factory().attrs({
  id: random.string(15, "0123456789"),
  name: random.string(32),
});

export const LenderFactory = new Factory().attrs({
  id: random.string(15, "0123456789"),
  name: random.string(32),
});

export const LARLayerFactory = new Factory().attrs({
  counties: () => [],
  lar: () => [],
  lenders: () => [LenderFactory.build()],
  metros: () => [GeoFactory.build()],
});

export const ConfigFactory = new Factory().attrs({
  choropleths: () => [],
  features: () => [],
  styleName: () => random.string(32),
  token: () => random.string(32),
});

export const MapboxStyleFactory = new Factory().attrs({
  center: () => [randLon(), randLat()],
  layers: () => [],
  zoom: randZoom,
});

export const MapboxFactory = new Factory().attrs({
  config: () => ConfigFactory.build(),
  visible: Set<string>(),
});

export const StateFactory = new Factory().attrs({
  larLayer: () => LARLayerFactory.build(),
  mapbox: () => MapboxFactory.build(),
  viewport: () => ViewportFactory.build(),
});
