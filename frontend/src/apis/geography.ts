import axios from "axios";

import { FilterEntity } from "../store/LARLayer";

function convert({ geoid, geo_type, name }): FilterEntity {
  return new FilterEntity({
    name,
    entityType: geo_type === 2 ? "county" : "metro",
    id: geoid,
  });
}

export async function fetchGeos(ids: string[]): Promise<FilterEntity[]> {
  if (ids.length) {
    const response = await axios.get(
      "/api/geo/",
      { params: { geoid__in: ids.join(",") } },
    );
    return response.data.results.map(convert);
  }
  return [];
}

export async function searchMetros(
  text: string,
  year: number,
): Promise<FilterEntity[]> {
  const response = await axios.get(
    "/shapes/search/metro/",
    { params: { year, q: text } },
  );
  return response.data.geos.map(convert);
}
