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

export const MapboxStyleFactory = new Factory().attrs({
  center: () => [randLon(), randLat()],
  layers: () => [],
  zoom: randZoom,
});

export const ConfigFactory = new Factory().attrs({
  choropleths: () => [],
  features: () => [],
  styleName: () => random.string(32),
  token: () => random.string(32),
});

export const StoreFactory = new Factory().attrs({
  config: () => ConfigFactory.build(),
  viewport: () => ViewportFactory.build(),
  visibleLayers: Set<string>(),
});
