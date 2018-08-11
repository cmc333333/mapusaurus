import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { collapse, expand } from "../../../store/Sidebar";
import { mergeProps } from "../Expander";

describe("mergeProps() ", () => {
  it("sets the correct props when expanded", () => {
    const dispatch = jest.fn();
    const props = mergeProps({ expanded: true }, { dispatch }, {});

    expect(props.icon).toEqual(faChevronUp);
    expect(props.title).toEqual("Hide Sidebar");
    props.onClick();
    expect(dispatch).toHaveBeenCalledWith(collapse());
  });

  it("sets the correct props when collapsed", () => {
    const dispatch = jest.fn();
    const props = mergeProps({ expanded: false }, { dispatch }, {});

    expect(props.icon).toEqual(faChevronDown);
    expect(props.title).toEqual("Expand Sidebar");
    props.onClick();
    expect(dispatch).toHaveBeenCalledWith(expand());
  });
});
