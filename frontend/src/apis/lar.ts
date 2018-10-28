import axios from "axios";

import Filters from "../store/Lar/Filters";

export interface LARPoint {
  geoid: string;
  houseCount: number;
  latitude: number;
  loanCount: number;
  longitude: number;
}

/*
 * Fetch loan data from the API and convert to LARPoint objects.
 */
export async function fetchLar(filters: Filters): Promise<LARPoint[]> {
  const params = {
    action_taken: "1,2,3,4,5",
    county: filters.county.join(","),
    lender: filters.lender.join(","),
    lien_status: filters.lienStatus.join(","),
    loan_purpose: filters.loanPurpose.join(","),
    metro: filters.metro.join(","),
    owner_occupancy: filters.ownerOccupancy.join(","),
    property_type: filters.propertyType.join(","),
  };

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
