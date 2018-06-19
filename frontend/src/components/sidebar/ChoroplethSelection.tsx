import glamorous from 'glamorous';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import typography from '../../util/typography';

import { showLayer, Store } from '../../store';

const MenuLi = glamorous.li({
  borderBottom: 'solid 1px black',
  margin: 0,
});
const MenuA = glamorous.a<{ active?: boolean }>(
  {
    display: 'block',
    fontWeight: 'bold',
    paddingBottom: typography.rhythm(.5),
    paddingLeft: typography.rhythm(1),
    paddingRight: typography.rhythm(1),
    paddingTop: typography.rhythm(.5),
  },
  ({ active }) => ({
    backgroundColor: active ? '#0af' : 'inherit',
  }),
);

function LayerLinkComponent({ isVisible, name, showLayer }) {
  const clickShowLayer = (ev) => {
    ev.preventDefault();
    showLayer();
  }
  return (
    <MenuLi>
      <MenuA active={isVisible} href="#" onClick={clickShowLayer}>
        { name }
      </MenuA>
    </MenuLi>
  );
}
const LayerLink = connect(
  ({ visibleLayers }: Store, { layerId }) =>
    ({ isVisible: visibleLayers.has(layerId) }),
  (dispatch, { layerId }) => ({ 
    showLayer: () => dispatch(showLayer(layerId)),
  }),
)(LayerLinkComponent);

export function ChoroplethSelection({ spaConfig }) {
  return (
    <glamorous.Ul margin="0">
      { spaConfig.choropleth.map(l =>
          <LayerLink key={l.id} layerId={l.id} name={l.name} />) 
      }
    </glamorous.Ul>
  );
}
export default connect(
  ({ spaConfig }: Store) => ({ spaConfig })
)(ChoroplethSelection);
