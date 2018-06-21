import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
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

function LayerLinkComponent({ isVisible, layer, selectChoropleth }) {
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
const LayerLink = connect(
  ({ visibleLayers }: Store, { layer }) =>
    ({ isVisible: visibleLayers.has(layer.id) }),
  (dispatch, { layer }) => ({
    selectChoropleth: () => dispatch(selectChoropleth(layer.id)),
  }),
)(LayerLinkComponent);

export function ChoroplethSelection({ choropleths }) {
  return (
    <glamorous.Ul margin="0">
      {choropleths.map(layer => <LayerLink key={layer.id} layer={layer} />)}
    </glamorous.Ul>
  );
}
export default connect(
  ({ config: { choropleths } }: Store) => ({ choropleths }),
)(ChoroplethSelection);
