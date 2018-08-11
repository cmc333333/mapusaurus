import { activateTab } from "../../../store/Sidebar";
import tabs from "../../../tabs";
import { mergeProps } from "../TabLink";

test("mergeProps()", () => {
  const dispatch = jest.fn();
  const props = mergeProps(null, { dispatch }, { tab: tabs[2] });

  expect(props.icon).toEqual(tabs[2].icon);
  expect(props.title).toEqual(tabs[2].title);
  props.onClick();
  expect(dispatch).toHaveBeenCalledWith(activateTab(tabs[2].id));
});
