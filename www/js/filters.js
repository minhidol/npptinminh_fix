'use strict';

/* Filters */

angular.module('dashboard.filters', []).
filter('getBuyPrice', [function () {
  return function (input) {
    if (!input || input.length == 0)
      return ''
    else {
      var price = parseInt(input.price) / parseInt(input.quantity)
      return numeral(price).format('0,0')
    }
  };
}]);
