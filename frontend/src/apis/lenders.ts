import axios from "axios";

import { FilterValue } from "../store/LARLayer";

function convert({ institution_id, name }): FilterValue {
  return new FilterValue({ name, id: institution_id });
}

export async function fetchLenders(ids: string[]): Promise<FilterValue[]> {
  if (ids.length) {
    const response = await axios.get(
      "/api/respondents/",
      { params: { institution_id__in: ids.join(",") } },
    );
    return response.data.results.map(convert);
  }
  return [];
}

export async function searchLenders(
  text: string,
  year: number,
): Promise<FilterValue[]> {
  const response = await axios.get(
    "/institutions/search/",
    { params: { year, auto: 1, q: text } },
  );
  return response.data.institutions.map(convert);
}
