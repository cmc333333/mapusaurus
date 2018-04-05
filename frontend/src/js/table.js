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
  $('#tableLoadImage').show();
  return $.ajax({
    url: '/reports/' + reportName + '/',
    data: {
      county: urlParam('county') || '',
      lender: urlParam('lender') || '',
      metro: urlParam('metro') || '',
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
    $('#tableLoadImage').hide();
    $tbl.appendTo($('#table-container')).show();
    activateTable($tbl);

    $('#closeTable').on('click', function(){
        toggleDataContainer(false);
        currentChart = 'undefined';  
        $('.chart-toggle').removeClass('active-layer');
    });
    generateTooltips('#table-container', [0,-1]);
  });
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
