import { combineReducers } from "redux";

import { reducer as larLayer } from "./LARLayer";
import { reducer as mapbox } from "./Mapbox";
import { reducer as sidebar } from "./Sidebar";
import { reducer as viewport } from "./Viewport";
import { reducer as window } from "./Window";

export default combineReducers({
  larLayer,
  mapbox,
  sidebar,
  viewport,
  window,
});
