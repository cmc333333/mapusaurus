import { OrderedMap, Set } from "immutable";
import { createSelector } from "reselect";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";

import { createReport } from "../../apis/reports";
import Filters, { addFilter, removeFilter, setFilters } from "./Filters";

export const groupNames = {
  custom: "Custom",
  homePurchase: "Home Purchase",
  refinance: "Refinance",
};
export type FilterGroup = keyof typeof groupNames;

export const stateNames = {
  "01": "Alabama",
  "02": "Alaska",
  "04": "Arizona",
  "05": "Arkansas",
  "06": "California",
  "08": "Colorado",
  "09": "Connecticut",
  "10": "Delaware",
  "11": "District of Columbia",
  "12": "Florida",
  "13": "Georgia",
  "15": "Hawaii",
  "16": "Idaho",
  "17": "Illinois",
  "18": "Indiana",
  "19": "Iowa",
  "20": "Kansas",
  "21": "Kentucky",
  "22": "Louisiana",
  "23": "Maine",
  "24": "Maryland",
  "25": "Massachusetts",
  "26": "Michigan",
  "27": "Minnesota",
  "28": "Mississippi",
  "29": "Missouri",
  "30": "Montana",
  "31": "Nebraska",
  "32": "Nevada",
  "33": "New Hampshire",
  "34": "New Jersey",
  "35": "New Mexico",
  "36": "New York",
  "37": "North Carolina",
  "38": "North Dakota",
  "39": "Ohio",
  "40": "Oklahoma",
  "41": "Oregon",
  "42": "Pennsylvania",
  "44": "Rhode Island",
  "45": "South Carolina",
  "46": "South Dakota",
  "47": "Tennessee",
  "48": "Texas",
  "49": "Utah",
  "50": "Vermont",
  "51": "Virginia",
  "53": "Washington",
  "54": "West Virginia",
  "55": "Wisconsin",
  "56": "Wyoming",
};
export type StateFips = keyof typeof stateNames;

export default interface UIOnly {
  group: FilterGroup;
  reportEmail: string;
  reportSent: boolean;
  state: StateFips;
}

export const SAFE_INIT: UIOnly = {
  group: "homePurchase",
  reportEmail: "",
  reportSent: false,
  state: "01",
};

const actionCreator = actionCreatorFactory("LAR/UI_ONLY");

export const sendReport = actionCreator<Filters>("SEND_REPORT");
export const setGroup = actionCreator<FilterGroup>("SET_GROUP");
export const setReportEmail = actionCreator<string>("SET_REPORT_EMAIL");
export const setState = actionCreator<StateFips>("SET_STATE");

export const reducer = reducerWithInitialState(SAFE_INIT)
  .case(sendReport, (original, filters) => {
    createReport(original.reportEmail, filters);
    return {
      ...original,
      reportSent: true,
    };
  })
  .case(setGroup, (original, group) => ({
    ...original,
    group,
  }))
  .case(setReportEmail, (original, reportEmail) => ({
    ...original,
    reportEmail,
    reportSent: false,
  }))
  .case(setState, (original, state) => ({
    ...original,
    state,
  }))
  .cases([addFilter, removeFilter, setFilters], original => ({
    ...original,
    reportSent: false,
  }))
  .build();
