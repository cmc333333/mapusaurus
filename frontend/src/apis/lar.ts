import axios from "axios";

import { LARPoint } from "../store/LARLayer";

/*
 * Fetch loan data from the API and convert to LARPoint objects.
 */
export async function fetchLar(
  countyIds: string[],
  lenderIds: string[],
  metroIds: string[],
): Promise<LARPoint[]> {
  const params: any = {
    action_taken: "1,2,3,4,5",
  };
  if (countyIds.length) {
    params.county = countyIds.join(",");
  }
  if (lenderIds.length) {
    params.lender = lenderIds.join(",");
  }
  if (metroIds.length) {
    params.metro = metroIds.join(",");
  }

  if (lenderIds.length && (countyIds.length || metroIds.length)) {
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
