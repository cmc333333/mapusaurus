import { Map } from "immutable";

import { LARLayerFactory, LARPointFactory } from "../../testUtils/Factory";
import LARLayer, {
  countyNamesSelector,
  lenderNamesSelector,
  metroNamesSelector,
  reducer,
  scatterPlotSelector,
  setCounties,
  setLarData,
  setLenders,
  setMetros,
} from "../LARLayer";

describe("reducer()", () => {
  it("sets lar data", () => {
    const lar = [LARPointFactory.build(), LARPointFactory.build()];

    const result = reducer(LARLayerFactory.build(), setLarData(lar));
    expect(result.lar).toEqual(lar);
  });

  it("sets counties", () => {
    const counties = [
      { id: "names", names: "here" },
      { id: "one", names: "two" },
    ];
    const result = reducer(LARLayerFactory.build(), setCounties(counties));
    expect(result.counties).toEqual(counties);
  });

  it("sets lenders", () => {
    const lenders = [
      { id: "names", names: "here" },
      { id: "one", names: "two" },
    ];
    const result = reducer(LARLayerFactory.build(), setLenders(lenders));
    expect(result.lenders).toEqual(lenders);
  });

  it("sets metros", () => {
    const metros = [
      { id: "names", names: "here" },
      { id: "one", names: "two" },
    ];
    const result = reducer(LARLayerFactory.build(), setMetros(metros));
    expect(result.metros).toEqual(metros);
  });
});

describe("scatterPlotSelector", () => {
  it("transforms the data", () => {
    const lar = [
      LARPointFactory.build({
        houseCount: 1,
        latitude: 11,
        loanCount: 4,
        longitude: 22,
      }),
      LARPointFactory.build({
        houseCount: 3,
        latitude: 33.33,
        loanCount: 75,
        longitude: 44.44,
      }),
    ];

    const circles = scatterPlotSelector(LARLayerFactory.build({ lar }));
    expect(circles).toEqual([
      { radius: 2, position: [22, 11] },
      { radius: 5, position: [44.44, 33.33] },
    ]);
  });
});

describe("name selectors", () => {
  const configs = [
    { inputField: "counties", selector: countyNamesSelector },
    { inputField: "lenders", selector: lenderNamesSelector },
    { inputField: "metros", selector: metroNamesSelector },
  ];
  configs.forEach(({ inputField, selector }) => {
    it("only includes ids that are present", () => {
      const inputs = [
        { id: "bbb", name: "BBB" },
        { id: "ccc", name: "CCC" },
      ];
      const input: any = { [inputField]: inputs };
      expect(selector(input)).toEqual(["BBB", "CCC"]);
    });

    it("sorts the results", () => {
      const inputs = [
        { id: "aaa", name: "ZZZ" },
        { id: "zzz", name: "AAA" },
      ];
      const input: any = { [inputField]: inputs };
      expect(selector(input)).toEqual(["AAA", "ZZZ"]);
    });
  });
});
