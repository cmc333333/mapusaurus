import axios from "axios";
import { Map, Set } from "immutable";

import { setLarData } from "../../store/LARLayer";
import { setStyle } from "../../store/Mapbox";
import {
  ApiConfigFactory,
  ConfigFactory,
  LARLayerFactory,
  MapboxFactory,
  MapboxStyleFactory,
  StateFactory,
} from "../../testUtils/Factory";
import {
  fetchCountyNames,
  fetchLar,
  fetchLenderNames,
  fetchMetroNames,
  fetchStyle,
} from "../apis";

jest.mock("axios");

const getMock = axios.get as jest.Mock; // hack around Jest typing

afterEach(getMock.mockReset);

describe("fetchStyle()", () => {
  it("hits the right endpoint", async () => {
    const state = StateFactory.build({
      mapbox: MapboxFactory.build({
        config: ConfigFactory.build({
          styleName: "some-style",
          token: "some-token",
        }),
      }),
    });
    getMock.mockImplementationOnce(() => ({ data: null }));
    await fetchStyle(state);
    expect(getMock).toHaveBeenCalled();
    const [path, options] = getMock.mock.calls[0];
    expect(path).toMatch(/\bsome-style\b/);
    expect(options).toEqual({ params: { access_token: "some-token" } });
  });

  it("creates an action based on the result", async () => {
    const style = MapboxStyleFactory.build();
    getMock.mockImplementationOnce(() => ({ data: style }));
    const result = await fetchStyle(StateFactory.build());
    expect(result).toEqual(setStyle(style));
  });
});

describe("fetchLar()", () => {
  it("hits the right endpoint", async () => {
    const state = StateFactory.build({
      larLayer: LARLayerFactory.build({
        config: ApiConfigFactory.build({
          lenders: Set<string>(["2012abcd123"]),
          metros: Set<string>(["333"]),
        }),
      }),
    });
    getMock.mockImplementationOnce(() => ({ data: {} }));
    await fetchLar(state);
    expect(getMock).toHaveBeenCalled();
    const options = getMock.mock.calls[0][1];
    expect(options.params).toEqual({
      action_taken: "1,2,3,4,5",
      lender: "2012abcd123",
      lh: "false",
      metro: "333",
      peers: "false",
      year: "2012",
    });
  });

  it("handles non-hmda displays", async () => {
    const state = StateFactory.build({
      larLayer: LARLayerFactory.build({
        config: ApiConfigFactory.build({
          lenders: Set<string>([]),
        }),
      }),
    });
    const result = await fetchLar(state);
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toEqual(setLarData([]));
  });

  it("creates an action in the right format", async () => {
    const state = StateFactory.build();
    getMock.mockImplementationOnce(() => ({
      data: {
        aaaaaaaa: {
          centlat: 3.3,
          centlon: -4.4,
          num_households: 2,
          volume: 1,
        },
        bbbbbbbb: {
          centlat: -7.7,
          centlon: 8.8,
          num_households: 6,
          volume: 5,
        },
        cccccccc: {
          centlat: 11,
          centlon: -12,
          num_households: 10,
          volume: 9,
        },
      } ,
    }));
    const result = await fetchLar(state);

    const lar = result.payload;
    // Ensure a consistent order
    lar.sort((l, r) => l.loanCount - r.loanCount);

    expect(lar).toEqual([
      { houseCount: 2, latitude: 3.3, loanCount: 1, longitude: -4.4 },
      { houseCount: 6, latitude: -7.7, loanCount: 5, longitude: 8.8 },
      { houseCount: 10, latitude: 11, loanCount: 9, longitude: -12 },
    ]);
  });
});

describe("fetching names", () => {
  const testConfigurations = [
    {
      action: fetchCountyNames,
      configField: "counties",
      endpoint: "/geo/",
      idField: "geoid",
    }, {
      action: fetchLenderNames,
      configField: "lenders",
      endpoint: "/respondents/",
      idField: "institution_id",
    }, {
      action: fetchMetroNames,
      configField: "metros",
      endpoint: "/geo/",
      idField: "geoid",
    },
  ];
  testConfigurations.forEach(configuration => {
    const { action, configField, endpoint, idField } = configuration;

    it("hits the right endpoint", async () => {
      const state = StateFactory.build({
        larLayer: LARLayerFactory.build({
          config: ApiConfigFactory.build({
            [configField]: Set<string>(["2012abcd123", "2013bcde234"]),
          }),
        }),
      });
      getMock.mockImplementationOnce(() => ({ data: { results: [] } }));
      await action(state);
      expect(getMock).toHaveBeenCalled();
      const [url, options] = getMock.mock.calls[0];
      expect(url).toMatch(endpoint);
      expect(options.params).toEqual({
        [`${idField}__in`]: "2012abcd123,2013bcde234",
      });
    });

    it("handles empty data", async () => {
      const state = StateFactory.build({
        larLayer: LARLayerFactory.build({
          config: ApiConfigFactory.build({ [configField]: [] }),
        }),
      });
      const result = await action(state);
      expect(getMock).not.toHaveBeenCalled();
      expect(result.payload).toEqual(Map<string, string>());
    });

    it("creates an action in the right format", async () => {
      const state = StateFactory.build({
        larLayer: LARLayerFactory.build({
          config: ApiConfigFactory.build({
            [configField]: Set<string>(["2012abcd123"]),
          }),
        }),
      });
      getMock.mockImplementationOnce(() => ({ data: { results: [
        { [idField]: "abc", name: "AAA" },
        { [idField]: "def", name: "BBB" },
      ]}}));
      const result = await action(state);

      expect(result.payload).toEqual(Map<string, string>({
        abc: "AAA",
        def: "BBB",
      }));
    });
  });
});
