import axios from "axios";

import { Action, setStyle } from "../store/actions";
import { Store } from "../store/store";

/*
 * Mapbox "style" data includes all layers; we'll load it from their API.
 */
export async function fetchStyle({ config }: Store): Promise<Action> {
  const response = await axios.get(
    `https://api.mapbox.com/styles/v1/${config.styleName}`
    + `?access_token=${config.token}`,
  );
  return setStyle(response.data);
}

/*
 * Kickoff fetch/load of data from the API.
 */
export function fetchData(store) {
  const state = store.getState();
  return Promise.all([
    fetchStyle(state).then(store.dispatch),
  ]);
}
