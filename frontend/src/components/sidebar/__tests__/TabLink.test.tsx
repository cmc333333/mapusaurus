import { shallow } from "enzyme";
import * as React from "react";

import { activateTab } from "../../../store/Sidebar";
import { SidebarFactory, StateFactory } from "../../../testUtils/Factory";
import { mapDispatchToProps, mapStateToProps, TabLink } from "../TabLink";

describe("<TabLink />", () => {
  [false, true].forEach(active => {
    it(`handles active status: ${active}`, () => {
      const rendered = shallow(
        <TabLink
          activateTab={jest.fn()}
          active={active}
          icon={{}}
          size={1}
        />,
      );
      expect(rendered.find("glamorous(a)").prop("active")).toBe(active);
    });
  });

  it("triggers activateTab when clicked", () => {
    const activateTab = jest.fn();
    const clickEv = { preventDefault: jest.fn() };
    const rendered = shallow(
      <TabLink
        activateTab={activateTab}
        active={true}
        icon={{}}
        size={1}
      />,
    );
    expect(activateTab).not.toHaveBeenCalled();
    expect(clickEv.preventDefault).not.toHaveBeenCalled();
    rendered.find("glamorous(a)").simulate("click", clickEv);
    expect(activateTab).toHaveBeenCalled();
    expect(clickEv.preventDefault).toHaveBeenCalled();
  });
});

describe("mapStateToProps()", () => {
  const state = StateFactory.build({
    sidebar: SidebarFactory.build({ activeTab: "features" }),
  });

  it("sets active when active", () => {
    expect(mapStateToProps(state, { tab: "features" })).toEqual({
      active: true,
    });
  });

  it("does not set active when not active", () => {
    expect(mapStateToProps(state, { tab: "other" })).toEqual({
      active: false,
    });
  });
});

test("mapDispatchToProps()", () => {
  const dispatch = jest.fn();
  const result = mapDispatchToProps(dispatch, { tab: "lar" });
  result.activateTab();
  expect(dispatch).toHaveBeenCalledWith(activateTab("lar"));
});
