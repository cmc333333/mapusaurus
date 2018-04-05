
    /* 
        ---- GET DATA SCRIPTS ----
    */    

    var rawGeo, rawLar, rawMinority, rawData, 
    selectedYear = selectedYear || 2015,
    isUIBlocked = false,
    larVolume = [],
    pctMinority = [],
    dataStore = {};
    dataStore.tracts = {};
    
    // Get minority and LAR data for census Tracts within the bounding box, for a specific criteria (actionTaken)
    // Return a promise.
    function getTractData( actionTakenVal, bounds ){
        $('#bubbles_loading').show();
        var endpoint = '/api/hmda/',
            params = { year: selectedYear,
                        'lh': false,
                        'peers': false };

        if( bounds && typeof bounds === 'object'){
            params.neLat = bounds.neLat;
            params.neLon = bounds.neLon;
            params.swLat = bounds.swLat;
            params.swLon = bounds.swLon;
        } else if (urlParam('metro')){
            params.metro = urlParam('metro');
        } else if (urlParam('county')){
            params.county = urlParam('county');
        } else {
            console.log("No metro or bounds provided");
        }

        var hash = getHashParams();

        // Check to see if Lender Hierarchy (lh) exists.
        if( typeof hash.lh !== 'undefined' ){
            params.lh = hash.lh.values;
        }

        if( typeof hash.peers !== 'undefined') {
            params.peers = hash.peers.values;
        }

        // Check to see if another year has been requested other than the default
        if ( urlParam('year') ){
            params.year = urlParam('year');
        }

        // Set the lender parameter based on the current URL param
        if ( urlParam('lender') ){
            params['lender'] = urlParam('lender');
        } else {
            console.log(' Lender parameter is required.');
            return false;
        }


        // If actionTaken, go get data, otherwise
        // let the user know about the default value
        if ( actionTakenVal ) {
            params['action_taken'] = actionTakenVal;
        } else {
            console.log('No action taken value - default (1-5) will be used.');
        }

        return $.ajax({
            url: endpoint, data: params, traditional: true,
            success: console.log('get API All Data request successful')
        }).fail( function( status ){
            console.log( 'no data was available at' + endpoint + '. status: ' + status );
            // Unblock the user interface (remove gradient)
            $.unblockUI();
            isUIBlocked = false;
        });

    }

    // Gets Branch Locations in bounds when a user selects "Branch Locations"
    // Returns a promise
    function getBranchesInBounds( bounds ){

        // Create the appropriate URL path to return values
        var endpoint = '/api/branchLocations/', 
            params = { year: selectedYear,
                       neLat: bounds.neLat,
                       neLon: bounds.neLon,
                       swLat: bounds.swLat,
                       swLon: bounds.swLon };

        // Add the lender param, if it exists, otherwise error out.
        if ( urlParam('lender') ){
            params['lender'] = urlParam('lender');
        } else {
            console.log(' Lender parameter is required.');
            return false;
        }

        return $.ajax({
            url: endpoint, data: params, traditional: true,
            success: console.log('Branch Location Get successful')
        }).fail( function( status ){
            console.log( 'no data was available at' + endpoint + '. status: ' + status );
        });

    } 

    /*
        END GET DATA SECTION
    */
