import { Map } from "immutable";
import * as React from "react";
import { connect } from "react-redux";

import { Geo, searchMetros } from "../../apis/geography";
import { addFilter, zoomToGeos } from "../../store/Lar/Filters";
import { addGeos } from "../../store/Lar/Lookups";
import { updatePoints } from "../../store/Lar/Points";
import HMDAFilter from "./HMDAFilter";

export function mergeProps({ lar }, { dispatch }) {
  const lookup = lar.lookups.geos;
  const existingMetros = lar.filters.metro.filter(id => lookup.has(id));
  const toStr = id => lookup.get(id).name;

  const existing = existingMetros.toArray()
    .sort((left, right) => toStr(left).localeCompare(toStr(right)));
  const fetchFn = async (str: string) => {
    const result = await searchMetros(str);
    return result.entrySeq().toArray() as [string, Geo][];
  };
  const setValue = ([geoId, geo]) => {
    dispatch(addGeos(Map<string, Geo>([[geoId, geo]])));
    dispatch(addFilter({ metro: geoId }));
    dispatch(updatePoints.action());
    dispatch(zoomToGeos.action());
  };

  return { existing, fetchFn, setValue, fieldName: "metro", label: "Metro" };
}

export default connect(
  ({ lar }) => ({ lar }),
  dispatch => ({ dispatch }),
  mergeProps,
)(HMDAFilter);
