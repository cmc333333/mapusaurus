import { Set } from "immutable";
import * as queryString from "query-string";

import { Store } from "../store/store";

function addHMDA({ county, lender, metro }, state: Store): Store {
  if (lender) {
    state.hmda = {
      config: { lender },
      lar: [],
      lenderName: "",
    };

    if (county) {
      state.hmda.config.county = county;
    }
    if (metro) {
      state.hmda.config.metro = metro;
    }
  }
  return state;
}

export function deserialize(hash: string, config): Store {
  const parsed = queryString.parse(hash);
  const mapConfig: Store = {
    config,
    viewport: {
      latitude: parseFloat(parsed.latitude),
      longitude: parseFloat(parsed.longitude),
      zoom: parseFloat(parsed.zoom),
    },
    visibleLayers: Set<string>(),
  };
  return addHMDA(parsed, mapConfig);
}

export function serialize({ hmda, viewport }: Store): string {
  const toSerialize: any = {
    latitude: viewport.latitude,
    longitude: viewport.longitude,
    zoom: viewport.zoom,
  };
  if (hmda) {
    toSerialize.lender = hmda.config.lender;
    if (hmda.config.county) {
      toSerialize.county = hmda.config.county;
    }
    if (hmda.config.metro) {
      toSerialize.metro = hmda.config.metro;
    }
  }
  return queryString.stringify(toSerialize);
}
