var reportTemplate,
    currentChart;

$(document).ready(function () {
    // Set up underscore table templates.
    _.templateSettings.variable = "data";
    reportTemplate = _.template($('script.report-template').html());
    
   // Create/destroy table when chart toggle is clicked.
   $('.chart-toggle').click(function (e) {
       var $target = $(e.target).closest('.chart-toggle'),
           id = $target.attr('id') || '';

       $('.chart-toggle').removeClass('active-layer');
       $target.addClass('active-layer');

       if (currentChart) {
           destroyData();
       }

       if (currentChart != id) {
           createTable(id.substr('chart-toggle__'.length));
           $('#table-container').show();

           currentChart = id;
           toggleDataContainer(true);
       } else {
           currentChart = null;
           toggleDataContainer(false);
           $('.chart-toggle').removeClass('active-layer');
       }
   });
});

/**
 * @name getTableData
 *
 * @description Gets 'lender' and 'metro' params from URL,
 * and uses them to construct a request for table data from
 * table api endpoint.
 *
 * @return {obj} $.ajax promise
 * 
 * 
 */
function getTableData(reportName) {
  return $.ajax({
    url: '/reports/' + reportName + '/',
    data: {
      lender: urlParam('lender') || '',
      metro: (urlParam('metro') || '').substr(4), // we prefix with the year
      year: urlParam('year') || '',
    },
    traditional: true,
  }).fail(function(response) {
    console.log('Error retrieving data', response.status, response.responseText);
  });
}

/**
 * @name createTable
 *
 * @description Makes request for table data if has 
 * not already been initiated. When table data is returned,
 * preps table data, builds & activates table, and
 * appends table to DOM.
 *
 * @params {string} reportName defines which report should be loaded
 * 
 * 
 */

function createTable(reportName) {
  getTableData(reportName).done(function (res) {
    var $tbl = buildTable(res);
    activateTable($tbl);
    $('#tableLoadImage').hide();
    $tbl.appendTo($('#table-container')).show();

    $('#closeTable').on('click', function(){
        toggleDataContainer(false);
        currentChart = 'undefined';  
        $('.chart-toggle').removeClass('active-layer');
    });
    generateTooltips('#table-container', [0,-1]);
  });
}

/**
 * @name prepTableData
 *
 * @description Preps table data for display.
 * Processes MSA object & each county object in 
 * county array. Converts their '_pct' values from 
 * decimals, and pulls their '_peer' values into a peerData object.
 *
 * @params {obj} data table data object to process
 * @return {obj} processed data object
 * 
 */
function prepTableData(data) {
    var msa = data.msa;
    _.extend(msa, prepNumbers(msa));
    msa.peerData = getPeerData(msa);
    
    _.each(data.counties, function (county, key) {
        _.extend(county, prepNumbers(county));
        county.peerData = getPeerData(county);
        county.geoid = key;
    });
    
    return data;
}

/**
 * @name decimalToPercentage
 *
 * @description converts decimals to percentages
 *
 * @params {number|string} val decimal value to convert
 * @return {number|null} number in percentage format
 * 
 * 
 */
function decimalToPercentage(val) {
    var num = parseFloat(val);
    if (!isNaN(num)) {
        return +(num * 100).toFixed(2);
    }
}

/**
 * @name prepNumbers
 *
 * @description Checks an object for properties ending with '_pct',
 * and then converts those properties from decimal to percentage.
 *
 * @params {obj} data object containing converted values
 * 
 * 
 */
function prepNumbers(data) {
    var obj = {},
        suffix = '_pct',
        len = suffix.length;
    
    _.each(data, function (val, key) {        
        if (key.indexOf(suffix, key.length - len) !== -1) {
            obj[key] = decimalToPercentage(val) || 0;
        }
    });
    
    return obj;
}

/**
 * @name getPeerData
 *
 * @description Returns an object containing all the properties
 * on an object that start with 'peer_'.
 *
 * @params {obj} data object to be searched for peer values
 * @return {obj} object containing all peer properties
 * 
 */
function getPeerData(data) {
    var peerData = {isPeer: true};
        
    _.each(data, function (val, key) {
        var strs = key.split('_');
        if (strs[0] === 'peer') {
            peerData[strs.slice(1).join('_')] = val;
        }
    });

    return peerData;
}


/* Table Generation */

/**
 * @name buildTable
 *
 * @description Builds a table.
 *
 * @params {obj} tableData data to use in table
 * @return {obj} jquery table object
 * 
 */
function buildTable(tableData) {
  _.each(tableData.data, function(row) {
    _.each(tableData.fields, function(fieldName) {
      var value = row[fieldName];
      if (_.isNumber(value)) {
        row[fieldName] = row[fieldName].toLocaleString();
      }
    });
  });

  return $(reportTemplate({ fieldNames: tableData.fields, rows: tableData.data }));
}


/**
 * @name activateTable
 *
 * @description Activates table plugins.
 *
 * @params {obj} $tbl jQuery table object
 * @return {obj} $tbl
 * 
 */
function activateTable($tbl) {
    // Activate tablesorter plugin
    return $tbl.tablesorter({
        headerTemplate: '',
        widgets: [ 'stickyHeaders' ],
        widgetOptions: {
            stickyHeaders_attachTo : '#data-container'
        }
    });
}

/**
 * @name destroyData
 *
 * @description Checks for type of current chart,
 * and then calls either the table or LAR chart
 * destroy function & hides the appropriate container
 * element.
 * 
 */
function destroyData() {
    // destroy table        
    destroyTable();
    $('#table-container').hide();
    setMapHeight();

}

/**
 * @name destroyTable
 *
 * @description Triggers 'destroy' event
 * on table for tableSorter plugin, then removes
 * table from DOM.
 * 
 */
function destroyTable() {
    $(".summary-data-table")
        .trigger("destroy")
        .remove();
    
    setMapHeight();        
}

/**
 * @name toggleDataContainer
 *
 * @description Updates showDataContainer global, shows or hides
 * the data & table containers, and calls setMapHeight to update
 * map & data container heights.
 *
 *
 * @params {boolean} showData whether to show or hide data container
 *
 */
function toggleDataContainer(showData) {
    showDataContainer = showData;
    if (showData) {
        $('#data-container').show();
        $('#data-container-sizer').show();
    } else {
        $('#data-container').hide();
        $('#data-container-sizer').hide();
    }
    setMapHeight();
}


// Helper function to check Odds class
function getOddsClass( ratio ){
    var oddsClass = 'odds-normal';
    if( 0 < ratio && ratio <= .4 || ratio === 0 ){
        oddsClass = 'odds-warning';
    } else if ( .4 < ratio && ratio < .8 ){
        oddsClass = 'odds-caution';
    } else {
        oddsClass = 'odds-normal';
    }
    return oddsClass;
}
