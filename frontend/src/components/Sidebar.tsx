import glamorous from 'glamorous';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';


import { hideLayer, showLayer, Store } from '../store';

function LayerLinkComponent({ hideLayer, layerId, showLayer, visibleLayers }) {
  if (visibleLayers.includes(layerId)) {
    return (
      <li>
        <strong>
          <a onClick={() => hideLayer(layerId)}>{ layerId }</a>
        </strong>
      </li>
    );
  }
  return <li><a onClick={() => showLayer(layerId)}>{ layerId }</a></li>;
}
const LayerLink = connect(
  ({ visibleLayers }: Store) => ({ visibleLayers }),
  (dispatch) => bindActionCreators({ hideLayer, showLayer }, dispatch),
)(LayerLinkComponent);

export function Sidebar({ allLayers }) {
  return (
    <>
      <h3>Layers</h3>
      <ul>
        { allLayers.map(l => <LayerLink key={l.id} layerId={l.id} />) }
      </ul>
    </>
  );
}
export default connect(
  ({ allLayers }: Store) => ({ allLayers })
)(Sidebar);
