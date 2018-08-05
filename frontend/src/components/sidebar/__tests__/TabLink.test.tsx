import { shallow } from "enzyme";
import * as React from "react";

import { activateTab } from "../../../store/Sidebar";
import tabs from "../../../tabs";
import { SidebarFactory, StateFactory } from "../../../testUtils/Factory";
import { mapDispatchToProps, mapStateToProps, TabLink } from "../TabLink";

describe("<TabLink />", () => {
  [false, true].forEach(active => {
    it(`handles active status: ${active}`, () => {
      const rendered = shallow(
        <TabLink
          activateTab={jest.fn()}
          active={active}
          tab={tabs[0]}
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
        tab={tabs[0]}
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
    sidebar: SidebarFactory.build({ activeTabId: tabs[0].id }),
  });

  it("sets active when active", () => {
    expect(mapStateToProps(state, { tab: tabs[0] })).toEqual({
      active: true,
    });
  });

  it("does not set active when not active", () => {
    expect(mapStateToProps(state, { tab: tabs[1] })).toEqual({
      active: false,
    });
  });
});

test("mapDispatchToProps()", () => {
  const dispatch = jest.fn();
  const result = mapDispatchToProps(dispatch, { tab: tabs[2] });
  result.activateTab();
  expect(dispatch).toHaveBeenCalledWith(activateTab(tabs[2].id));
});
