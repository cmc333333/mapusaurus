import { combineReducers } from "redux";

import { reducer as lar } from "./Lar";
import { reducer as mapbox } from "./Mapbox";
import { reducer as sidebar } from "./Sidebar";
import { reducer as viewport } from "./Viewport";
import { reducer as window } from "./Window";

export default combineReducers({
  lar,
  mapbox,
  sidebar,
  viewport,
  window,
});
