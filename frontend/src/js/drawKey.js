
/*
    Draw the SVG Key based on radius params of existing Leaflet circle ranges
*/
function buildKeyCircles(){
    var params = getHashParams();
    var selector = $('#keySvg');
    selector.html('');
    
    // Circles to be generated
    var circles = getRange(map._layers);
    
    // Handle return of empty array (no tracts or no records)
    if( circles.length === 0 ){
        selector.html('No records found');
        return false;
    }

    // Get max, middle, min
    // Draw new circles for each in Leaflet with index IDs
    // Put those index IDs into an array
    // Copy those SVG elements using jQuery to the Key

    // Get the current scaling value from the drop-down menu.
    var posx = 0;
    var rad = 0;
    var maxRad = circles[circles.length - 1]._radius;
    var posy = maxRad*2;
    var textPosy = posy + 16; // Add 16px for a line of text

    // Create the initial SVG element
    var svgStr = '<svg height="' + (maxRad*2 + 20) + '">';

    for( var i=0; i<circles.length; i++ ){
        var circle = circles[i];
        rad = circle._radius;
        posx = posx + 45; // Move the circles horizontally, y values stay constant    
        svgStr += '<circle cx="' + posx + '" cy="' + (posy-rad) + '" r="' + rad + '" fillColor="#111111" fill-opacity=".7" stroke=false color="#333"/>';
        svgStr += '<text x="' + (posx) + '" y="' + textPosy + '" font-size="1em" text-anchor="middle">'+ circle.perThousandHouseholds.toFixed(2) + '</text>';
    }

    svgStr += '</svg>';
    selector.html(svgStr);

}

/*
    Get the circle data for a min, max, and median point in between
*/
function getRange(data){
  // Find all circles in the current leaflet layer that have volume
  var circles = _.filter(data, function(circle) {
    return circle.type === 'tract-circle' && circle.perThousandHouseholds > 0;
  });
  circles = _.sortBy(
    circles, function(circle) { return circle.perThousandHouseholds; });

  if (circles.length <= 3) {
    return circles;
  }

  var middleIdx = (circles.length / 2).toFixed();
  return [circles[0], circles[middleIdx], circles[circles.length - 1]];
}
