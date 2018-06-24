import axios from "axios";

import { Action, setLar, setStyle } from "../store/actions";
import { Store } from "../store/store";

/*
 * Mapbox "style" data includes all layers; we'll load it from their API.
 */
export async function fetchStyle({ config }: Store): Promise<Action> {
  const response = await axios.get(
    `https://api.mapbox.com/styles/v1/${config.styleName}`,
    { params: { access_token: config.token } },
  );
  return setStyle(response.data);
}

/*
 * Fetch loan data from the API and convert to LARPoint objects.
 */
export async function fetchLar({ hmda }: Store): Promise<Action> {
  if (hmda) {
    const response = await axios.get(
      "/api/hmda/",
      {
        params: {
          ...hmda.config,
          // using several default parameters for now
          action_taken: "1,2,3,4,5",
          lh: "false",
          peers: "false",
          year: hmda.config.lender.substr(0, 4),
        },
      },
    );
    // Convert between API format and ours
    const lar = Object.values(response.data).map((obj: any) => ({
      houseCount: obj.num_households,
      latitude: obj.centlat,
      loanCount: obj.volume,
      longitude: obj.centlon,
    }));
    return setLar(lar);
  }
  return setLar([]);
}

/*
 * Kickoff fetch/load of data from the API.
 */
export function fetchData(store) {
  const state = store.getState();
  return Promise.all([
    fetchStyle(state).then(store.dispatch),
    fetchLar(state).then(store.dispatch),
  ]);
}
