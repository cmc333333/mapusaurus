import { shallow } from "enzyme";
import glamorous from "glamorous";
import * as React from "react";

import { radiusFnSelector } from "../../../store/Lar/Points";
import { pixelsPerMeterSelector } from "../../../store/Viewport";
import {
  LarFactory,
  LARPointFactory,
  StateFactory,
  ViewportFactory,
} from "../../../testUtils/Factory";
import { LoanCircle, mapStateToProps } from "../LoanCircle";

jest.mock("../../../store/Lar/Points");
jest.mock("../../../store/Viewport");

const radiusFnSelectorMock = radiusFnSelector as any as jest.Mock;
const pixelsPerMeterSelectorMock = pixelsPerMeterSelector as any as jest.Mock;

describe("<LoanCircle />", () => {
  const rendered = shallow(
    <LoanCircle height={10} text="Some content" width={20} />,
  );
  it("includes the given text", () => {
    expect(rendered.find("div").text()).toBe("Some content");
  });

  it("has a div of the appropriate size", () => {
    expect(rendered.find({ height: "10px", width: "20px" })).toHaveLength(1);
  });
});

describe("mapStateToProps()", () => {
  const state = StateFactory.build({
    lar: LarFactory.build({
      points: {
        raw: [
          LARPointFactory.build({ houseCount: 11, loanCount: 4 }),
          LARPointFactory.build(),
          LARPointFactory.build(),
          LARPointFactory.build({ houseCount: 1000, loanCount: 1 }),
          LARPointFactory.build({ houseCount: 9, loanCount: 3 }),
        ],
      },
    }),
  });
  pixelsPerMeterSelectorMock.mockImplementation(() => ({ x: 123, y: 456 }));
  radiusFnSelectorMock.mockImplementation(() => () => 55);

  it("selects the correct point", () => {
    const { text } = mapStateToProps(state, { percentile: 4 / 5 });
    expect(text).toBe("1.0");
  });

  it("derives the height and width based on viewport and point", () => {
    pixelsPerMeterSelectorMock.mockImplementationOnce(() => ({ x: 33, y: 44 }));
    radiusFnSelectorMock.mockImplementationOnce(() => () => 88);

    const { height, width } = mapStateToProps(state, { percentile: 0 });
    expect(height).toEqual(2 * 88 * 44);
    expect(width).toEqual(2 * 88 * 33);
    expect(pixelsPerMeterSelector as any as jest.Mock)
      .toHaveBeenCalledWith(state.viewport);
    expect(radiusFnSelectorMock).toHaveBeenCalled();
  });

  it("derives the text from the point", () => {
    const { text } = mapStateToProps(state, { percentile: 1 });
    expect(text).toBe("333.3");
  });
});
