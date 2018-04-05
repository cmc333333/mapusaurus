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

  setupMetroSearch();
});
