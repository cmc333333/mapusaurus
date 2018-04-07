'use strict';

$(document).ready(function() {
  function setupMetroSearch() {
    var $container = $('#metro-search');
    var $searchBox = $container.find('[name=q]');
    var $metro = $container.find('[name=metro]');
    var $submit = $container.find('[type=submit]');
    var year = $container.find('[name=year]').val();
    var search = new Bloodhound({
      datumTokenizer: function(d) {
        return Bloodhound.tokenizers.whitespace(d.name);
      },
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: {
        filter: function(resp) {
          return resp.geos;
        },
        prepare: function(query, settings) {
          settings.url = '/shapes/search/metro/?year=' + year + '&q=' + query;
          return settings;
        },
        url: '/shapes/search/metro/?year=' + year
      }
    });

    search.initialize();

    $searchBox
      .typeahead(
        { highlight: true }, { displayKey: 'name', source: search.ttAdapter() })
      .on('keyup', function() {
        //  Not all key changes affect the selected name
        if ($searchBox.val() !== $metro.data('name')) {
          $metro.val('');
          $submit.prop('disabled', true).addClass('btn__disabled');
        }
      })
      .on('typeahead:selected', function(ev, suggestion) {
        $metro.val(suggestion.geoid).data('name', suggestion.name);
        $submit.prop('disabled', false).removeClass('btn__disabled');
      });
  }
  function setupCountySearch() {
    var $container = $('#county-search');
    var $searchBox = $container.find('[name=q]');
    var $state = $container.find('[name=state]');
    var $county = $container.find('[name=county]');
    var $submit = $container.find('[type=submit]');
    var $selectedCounties = $container.find('.selected-counties');
    var year = $container.find('[name=year]').val();
    var search = new Bloodhound({
      datumTokenizer: function(d) {
        return Bloodhound.tokenizers.whitespace(d.name);
      },
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: {
        filter: function(resp) {
          return resp.geos;
        },
        prepare: function(query, settings) {
          var state = $state.val();
          settings.url = '/shapes/search/county/?year=' + year + '&state=' + state + '&q=' + query;
          return settings;
        },
        url: '/shapes/search/county/?year=' + year
      }
    });
    function resetCounties() {
      var geoids = [];
      $selectedCounties.find('li').each(function() {
        geoids.push($(this).attr('data-geoid'));
      });
      $county.val(geoids.join(','));
      if (geoids.length) {
        $submit.prop('disabled', false).removeClass('btn__disabled');
      } else {
        $submit.prop('disabled', true).addClass('btn__disabled');
      }
    }

    search.initialize();

    $searchBox
      .typeahead(
        { highlight: true }, { displayKey: 'name', source: search.ttAdapter() })
      .on('typeahead:selected', function(ev, suggestion) {
        var state = $state.find('option:selected').data('abbr');
        var $li = $('<li/>', { text: suggestion.name + ' County, ' + state + ' '});
        $li.appendTo($selectedCounties);
        $li.append($('<button/>', { class: 'selected-counties__remove', text: 'x' })
          .click(function() {
            $li.remove();
            resetCounties();
          }));
        $li.attr('data-geoid', suggestion.geoid);
        resetCounties();
        $searchBox.typeahead('val', '');
      });

    $state.on('change', function() {
      $searchBox.typeahead('val', '');
    });
  }

  setupMetroSearch();
  setupCountySearch();
});
