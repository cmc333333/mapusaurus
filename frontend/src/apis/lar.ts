import axios from "axios";

import { LARPoint } from "../store/LARLayer";

/*
 * Fetch loan data from the API and convert to LARPoint objects.
 */
export async function fetchLar(arrayParams): Promise<LARPoint[]> {
  const params: any = {
    action_taken: "1,2,3,4,5",
  };
  Object.keys(arrayParams)
    .forEach(key => params[key] = arrayParams[key].join(","));

  if (params.lender && (params.county || params.metro)) {
    const response = await axios.get("/api/lar/", { params });
    // Convert between API format and ours
    return response.data.map(obj => ({
      houseCount: obj.num_households,
      latitude: obj.centlat,
      loanCount: obj.volume,
      longitude: obj.centlon,
    }));
  }
  return [];
}
