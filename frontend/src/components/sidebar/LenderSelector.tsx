import { Map } from "immutable";
import * as React from "react";
import { connect } from "react-redux";

import { searchLenders } from "../../apis/lenders";
import { addFilter } from "../../store/Lar/Filters";
import { addLenders } from "../../store/Lar/Lookups";
import { updatePoints } from "../../store/Lar/Points";
import HMDAFilter from "./HMDAFilter";

export function mergeProps({ lar }, { dispatch }) {
  const lookup = lar.lookups.lenders;
  const existingLenders = lar.filters.lender.filter(id => lookup.has(id));
  const { year } = lar.filters;

  const existing = existingLenders.toArray()
    .sort((l, r) => lookup.get(l).localeCompare(lookup.get(r)));
  const fetchFn = async (str: string) => {
    const result = await searchLenders(str, year);
    return result.entrySeq().toArray() as [string, string][];
  };
  const setValue = ([lenderId, name]) => {
    dispatch(addLenders(Map<string, string>([[lenderId, name]])));
    dispatch(addFilter({ lender: lenderId }));
    dispatch(updatePoints.action());
  };

  return { existing, fetchFn, setValue, fieldName: "lender", label: "Lender" };
}

export default connect(
  ({ lar }) => ({ lar }),
  dispatch => ({ dispatch }),
  mergeProps,
)(HMDAFilter);
