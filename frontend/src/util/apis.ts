import axios from "axios";
import { Map } from "immutable";

import {
  addCountyNames,
  addLenderNames,
  addMetroNames,
  setLarData,
} from "../store/LARLayer";
import { setStyle } from "../store/Mapbox";
import State from "../store/State";

/*
 * Mapbox "style" data includes all layers; we'll load it from their API.
 */
export async function fetchStyle({ mapbox }: State) {
  const response = await axios.get(
    `https://api.mapbox.com/styles/v1/${mapbox.config.styleName}`,
    { params: { access_token: mapbox.config.token } },
  );
  return setStyle(response.data);
}

/*
 * Fetch loan data from the API and convert to LARPoint objects.
 */
export async function fetchLar(state: State) {
  const config = state.larLayer.config;

  const county = config.counties.length ? config.counties[0] : "";
  const lender = config.lenders.length ? config.lenders[0] : "";
  const metro = config.metros.length ? config.metros[0] : "";
  const params: any = {
    lender,
    action_taken: "1,2,3,4,5",
    lh: "false",
    peers: "false",
    year: lender.substr(0, 4),
  };
  if (county) {
    params.county = county;
  } else if (metro) {
    params.metro = metro;
  }

  if (lender) {
    const response = await axios.get("/api/hmda/", { params });
    // Convert between API format and ours
    const lar = Object.values(response.data).map((obj: any) => ({
      geoid: obj.geoid,
      houseCount: obj.num_households,
      latitude: obj.centlat,
      loanCount: obj.volume,
      longitude: obj.centlon,
    }));
    return setLarData(lar);
  }
  return setLarData([]);
}

export async function fetchLenderNames({ larLayer }: State) {
  if (larLayer.config.lenders.length) {
    const response = await axios.get(
      `/api/respondents/`,
      { params: { institution_id__in: larLayer.config.lenders.join(",") } },
    );
    const pairs = response.data.results.map(r => [r.institution_id, r.name]);
    return addLenderNames(Map<string, string>(pairs));
  }
  return addLenderNames(Map<string, string>());
}

export async function fetchCountyNames({ larLayer }: State) {
  if (larLayer.config.counties.length) {
    const response = await axios.get(
      `/api/geo/`,
      { params: { geoid__in: larLayer.config.counties.join(",") } },
    );
    const pairs = response.data.results.map(r => [r.geoid, r.name]);
    return addCountyNames(Map<string, string>(pairs));
  }
  return addCountyNames(Map<string, string>());
}

export async function fetchMetroNames({ larLayer }: State) {
  if (larLayer.config.metros.length) {
    const response = await axios.get(
      `/api/geo/`,
      { params: { geoid__in: larLayer.config.metros.join(",") } },
    );
    const pairs = response.data.results.map(r => [r.geoid, r.name]);
    return addMetroNames(Map<string, string>(pairs));
  }
  return addMetroNames(Map<string, string>());
}

/*
 * Kickoff fetch/load of data from the API.
 */
export function fetchData(store) {
  const state: State = store.getState();
  return Promise.all([
    fetchCountyNames(state).then(store.dispatch),
    fetchLar(state).then(store.dispatch),
    fetchLenderNames(state).then(store.dispatch),
    fetchMetroNames(state).then(store.dispatch),
    fetchStyle(state).then(store.dispatch),
  ]);
}
