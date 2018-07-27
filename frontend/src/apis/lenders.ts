import axios from "axios";

import { Lender } from "../store/LARLayer";

export async function fetchLenders(ids: string[]): Promise<Lender[]> {
  if (ids.length) {
    const response = await axios.get(
      "/api/respondents/",
      { params: { institution_id__in: ids.join(",") } },
    );
    return response.data.results.map(({ institution_id, name }) => ({
      name,
      id: institution_id,
    }));
  }
  return [];
}

export async function searchLenders(
  text: string,
  year: number,
): Promise<Lender[]> {
  const response = await axios.get(
    "/institutions/search/",
    { params: { year, auto: 1, q: text } },
  );
  return response.data.institutions.map(({ institution_id, name }) => ({
    name,
    id: institution_id,
  }));
}
