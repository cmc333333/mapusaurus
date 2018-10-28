import DeckGL, { ScatterplotLayer } from "deck.gl";
import glamorous from "glamorous";
import * as React from "react";
import ReactMapGL, { NavigationControl } from "react-map-gl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { scatterPlotSelector } from "../store/Lar/Points";
import { currentStyleSelector } from "../store/Mapbox";
import State from "../store/State";
import { setViewport } from "../store/Viewport";
import { largeSpace } from "../theme";
import MapKey from "./MapKey";

export function Map({
  changeViewport,
  height,
  mapStyle,
  mapboxApiAccessToken,
  scatterPlot,
  viewport,
  width,
}) {
  const layers = [
    new ScatterplotLayer({
      data: scatterPlot,
      getColor: [255, 158, 22, 200],
      id: "lar-circle",
    }),
    new ScatterplotLayer({
      data: scatterPlot,
      getColor: [0, 0, 0, 255],
      id: "lar-outline",
      outline: true,
    }),
  ];

  return (
    <ReactMapGL
      {...viewport}
      height={height}
      mapboxApiAccessToken={mapboxApiAccessToken}
      mapStyle={mapStyle}
      maxZoom={12}
      onViewportChange={changeViewport}
      width={width}
    >
      <DeckGL {...viewport} layers={layers} width={width} height={height} />
      <glamorous.Div position="absolute" right={largeSpace} top={largeSpace}>
        <NavigationControl
          onViewportChange={changeViewport}
          showCompass={false}
        />
      </glamorous.Div>
      <MapKey bottom={largeSpace} position="absolute" right={largeSpace} />
    </ReactMapGL>
  );
}
export default connect(
  (state: State) => ({
    height: state.window.height,
    mapStyle: currentStyleSelector(state.mapbox),
    mapboxApiAccessToken: state.mapbox.token,
    scatterPlot: scatterPlotSelector(state.lar.points),
    viewport: state.viewport,
    width: state.window.width,
  }),
  dispatch => ({
    changeViewport: ({ latitude, longitude, zoom }) => {
      dispatch(setViewport({ latitude, longitude, zoom }));
    },
  }),
)(Map);
