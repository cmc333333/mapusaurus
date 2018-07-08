import { Map, Set } from "immutable";

import LARLayer from "./LARLayer";
import Mapbox from "./Mapbox";
import Viewport from "./Viewport";

export default interface State {
  larLayer: LARLayer;
  mapbox: Mapbox;
  viewport: Viewport;
}
