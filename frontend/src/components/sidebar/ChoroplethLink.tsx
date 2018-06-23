import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";
import typography from "../../util/typography";

import { selectChoropleth } from "../../store/actions";
import { Store } from "../../store/store";

const MenuLi = glamorous.li({
  borderBottom: "solid 1px black",
  margin: 0,
});
const MenuA = glamorous.a<{ active?: boolean }>(
  {
    display: "block",
    fontWeight: "bold",
    paddingBottom: typography.rhythm(.5),
    paddingLeft: typography.rhythm(1),
    paddingRight: typography.rhythm(1),
    paddingTop: typography.rhythm(.5),
  },
  ({ active }) => ({
    backgroundColor: active ? "#0af" : "inherit",
  }),
);

export function ChoroplethLink({ isVisible, layer, selectChoropleth }) {
  const clickChoropleth = ev => {
    ev.preventDefault();
    selectChoropleth();
  };
  return (
    <MenuLi>
      <MenuA active={isVisible} href="#" onClick={clickChoropleth}>
        {layer.name}
      </MenuA>
    </MenuLi>
  );
}

export function mapStateToProps({ visibleLayers }: Store, { layer }) {
  return { isVisible: visibleLayers.has(layer.id) };
}

export function mapDispatchToProps(dispatch, { layer }) {
  return { selectChoropleth: () => dispatch(selectChoropleth(layer.id)) };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChoroplethLink);
