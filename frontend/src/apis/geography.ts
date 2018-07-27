import axios from "axios";

import { Geography } from "../store/LARLayer";

export async function fetchGeos(ids: string[]): Promise<Geography[]> {
  if (ids.length) {
    const response = await axios.get(
      "/api/geo/",
      { params: { geoid__in: ids.join(",") } },
    );
    return response.data.results.map(({ geoid, name }) => ({
      name,
      id: geoid,
    }));
  }
  return [];
}
