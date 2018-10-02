import { combineReducers } from "redux";

import { reducer as larFilters } from "./LARFilters";
import { reducer as larLayer } from "./LARLayer";
import { reducer as mapbox } from "./Mapbox";
import { reducer as sidebar } from "./Sidebar";
import { reducer as viewport } from "./Viewport";
import { reducer as window } from "./Window";

export default combineReducers({
  larFilters,
  larLayer,
  mapbox,
  sidebar,
  viewport,
  window,
});
