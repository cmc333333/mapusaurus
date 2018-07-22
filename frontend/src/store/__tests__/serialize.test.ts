import { Set } from "immutable";
import * as qs from "qs";

import {
  LARLayerFactory,
  StateFactory,
  ViewportFactory,
} from "../../testUtils/Factory";
import serialize from "../serialize";

describe("serialize()", () => {
  it("serializes the viewport, ignoring other args", () => {
    const result = serialize(StateFactory.build({
      larLayer: LARLayerFactory.build({
        counties: [],
        lenders: [],
        metros: [],
      }),
      viewport: ViewportFactory.build({
        latitude: 44,
        longitude: 55.55,
        zoom: 6,
      }),
    }));

    expect(qs.parse(result)).toEqual({
      latitude: "44",
      longitude: "55.55",
      zoom: "6",
    });
  });

  it("serializes lar config", () => {
    const result = serialize(StateFactory.build({
      larLayer: LARLayerFactory.build({
        counties: [
          { id: "aaa", name: "AAA" },
          { id: "bbb", name: "BBB" },
          { id: "ccc", name: "CCC" },
        ],
        lenders: [
          { id: "12", name: "one-two" },
          { id: "34", name: "three-four" },
        ],
        metros: [{ id: "Z", name: "zee" }],
      }),
    }));
    expect(result).toMatch(/\bcounties%5B%5D=aaa\b/);
    expect(result).toMatch(/\bcounties%5B%5D=bbb\b/);
    expect(result).toMatch(/\bcounties%5B%5D=ccc\b/);
    expect(result).toMatch(/\blenders%5B%5D=12\b/);
    expect(result).toMatch(/\blenders%5B%5D=34\b/);
    expect(result).toMatch(/\bmetros%5B%5D=Z\b/);
  });
});
