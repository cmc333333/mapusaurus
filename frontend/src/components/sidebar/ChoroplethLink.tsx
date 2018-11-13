import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { selectChoropleth } from "../../store/Mapbox";
import State from "../../store/State";
import { border, inverted, largeSpace, mediumSpace } from "../../theme";

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
  ({ active }) => {
    if (active) {
      return inverted;
    }
    return {};
  },
);

export function ChoroplethLink({ isVisible, name, onClick }) {
  return (
    <MenuLi>
      <MenuA active={isVisible} href="#" onClick={onClick}>
        {name}
      </MenuA>
    </MenuLi>
  );
}

export function mapStateToProps({ mapbox }: State, { layerId }) {
  return { isVisible: mapbox.choropleth === layerId };
}

export function mapDispatchToProps(dispatch, { layerId }) {
  return {
    onClick: ev => {
      ev.preventDefault();
      dispatch(selectChoropleth(layerId));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChoroplethLink);
