import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { selectChoropleth } from "../../store/Mapbox";
import State from "../../store/State";
import { activeBg, border, largeSpace, mediumSpace } from "../../theme";

const MenuLi = glamorous.li({
  borderBottom: border,
  margin: 0,
});
const MenuA = glamorous.a<{ active?: boolean }>(
  {
    display: "block",
    fontWeight: "bold",
    paddingBottom: mediumSpace,
    paddingLeft: largeSpace,
    paddingRight: largeSpace,
    paddingTop: mediumSpace,
  },
  ({ active }) => ({
    background: active ? activeBg : "inherit",
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

export function mapStateToProps({ mapbox }: State, { layer }) {
  return { isVisible: mapbox.visible.has(layer.id) };
}

export function mapDispatchToProps(dispatch, { layer }) {
  return { selectChoropleth: () => dispatch(selectChoropleth(layer.id)) };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChoroplethLink);
