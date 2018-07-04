import { Set } from "immutable";
import * as qs from "qs";

import { HMDA, Store } from "../store/store";

function addHMDA({ county, lender, metro }, state: Store): Store {
  if (lender) {
    const hmda: HMDA = {
      config: { lender },
      lar: [],
      lenderName: "",
    };

    if (county) {
      hmda.config.county = county;
    }
    if (metro) {
      hmda.config.metro = metro;
    }
    return { hmda, ...state };
  }
  return state;
}

export function deserialize(hash: string, config): Store {
  const parsed = qs.parse(hash);
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
  return qs.stringify({
    ...viewport,
    ...(hmda ? hmda.config : {}),
  });
}
