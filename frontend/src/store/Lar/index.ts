import { combineReducers } from "redux";

import Filters, {
  reducer as filters,
  SAFE_INIT as filtersInit,
} from "./Filters";
import Lookups, {
  reducer as lookups,
  SAFE_INIT as lookupsInit,
} from "./Lookups";
import Points, { reducer as points, SAFE_INIT as pointsInit } from "./Points";
import UIOnly, { reducer as uiOnly, SAFE_INIT as uiOnlyInit } from "./UIOnly";

export default interface Lar {
  filters: Filters;
  lookups: Lookups;
  points: Points;
  uiOnly: UIOnly;
}

export const SAFE_INIT: Lar = {
  filters: filtersInit,
  lookups: lookupsInit,
  points: pointsInit,
  uiOnly: uiOnlyInit,
};

export const reducer = combineReducers({ filters, lookups, points, uiOnly });
