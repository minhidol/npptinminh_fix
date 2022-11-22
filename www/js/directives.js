'use strict';

/* Directives */


angular.module('dashboard.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]).directive('numberInput', function($filter) {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ngModelCtrl) {

      ngModelCtrl.$formatters.push(function(modelValue) {
        return setDisplayNumber(modelValue, true);
      });

      ngModelCtrl.$parsers.push(function(viewValue) {
        setDisplayNumber(viewValue);
        return setModelNumber(viewValue);
      });

      elem.bind('keyup focus', function() {
        setDisplayNumber(elem.val());
      });

      function setDisplayNumber(val, formatter) {
        var valStr, displayValue;

        if (typeof val === 'undefined' || val === null ) {
          return 0;
        }

        valStr = val.toString();
        displayValue = valStr.replace(/,/g, '').replace(/[A-Za-z]/g, '');
        displayValue = parseFloat(displayValue);
        displayValue = (!isNaN(displayValue)) ? displayValue.toString() : '';

        // handle leading character -/0
        if (valStr.length === 1 && valStr[0] === '-') {
          displayValue = valStr[0];
        } else if (valStr.length === 1 && valStr[0] === '0') {
          displayValue = '';
        } else {
          displayValue = $filter('number')(displayValue);
        }

        // handle decimal
        if (!attrs.integer) {
          if (displayValue.indexOf('.') === -1) {
            if (valStr.slice(-1) === '.') {
              displayValue += '.';
            } else if (valStr.slice(-2) === '.0') {
              displayValue += '.0';
            } else if (valStr.slice(-3) === '.00') {
              displayValue += '.00';
            }
          } // handle last character 0 after decimal and another number
          else {
            if (valStr.slice(-1) === '0') {
              displayValue += '0';
            }
          }
        }

        if (attrs.positive && displayValue[0] === '-') {
          displayValue = displayValue.substring(1);
        }

        if (typeof formatter !== 'undefined') {
          return (displayValue === '') ? 0 : displayValue;
        } else {
          elem.val((displayValue === '0') ? '' : displayValue);
        }
      }

      function setModelNumber(val) {
        var modelNum = val.toString().replace(/,/g, '').replace(/[A-Za-z]/g, '');
        modelNum = parseFloat(modelNum);
        modelNum = (!isNaN(modelNum)) ? modelNum : 0;
        if (modelNum.toString().indexOf('.') !== -1) {
          modelNum = Math.round((modelNum + 0.00001) * 100) / 100;
        }
        if (attrs.positive) {
          modelNum = Math.abs(modelNum);
        }
        return modelNum;
      }
    }
  };
});
