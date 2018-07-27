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
  const county = countyIds.length ? countyIds[0] : "";
  const lender = lenderIds.length ? lenderIds[0] : "";
  const metro = metroIds.length ? metroIds[0] : "";
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
    return lar;
  }
  return [];
}
