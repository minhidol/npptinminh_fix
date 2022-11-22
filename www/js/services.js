'use strict';

angular.module('dashboard.services', [])
  .factory('showAlert', function () {
    var httpApi = {};

    httpApi.showSuccess = function (delay, str) {
      if (delay) {
        $('#alertMessage').removeClass('error info warning').addClass('success').html(str).stop(true, true).show().animate({
          opacity: 1,
          right: '10'
        }, 500, function () {
          $(this).delay(delay).animate({
            opacity: 0,
            right: '-20'
          }, 500, function () {
            $(this).hide();
          });
        });
        return false;
      }
      $('#alertMessage').addClass('success').html(str).stop(true, true).show().animate({
        opacity: 1,
        right: '10'
      }, 500);
    };

    httpApi.showError = function (delay, str) {
      if (delay) {
        $('#alertMessage').removeClass('success info warning').addClass('error').html(str).stop(true, true).show().animate({
          opacity: 1,
          right: '10'
        }, 500, function () {
          $(this).delay(delay).animate({
            opacity: 0,
            right: '-20'
          }, 500, function () {
            $(this).hide();
          });
        });
        return false;
      }
      $('#alertMessage').addClass('error').html(str).stop(true, true).show().animate({
        opacity: 1,
        right: '10'
      }, 500);
    };
    return httpApi;
  })
  .factory('renderSelect', function () {
    var httpApi = {};

    httpApi.initDataSelect = function (data, target, placeholder, code, store, default_select, limit, product_type) {
      var html = '';
      $(target).next('div').remove();
      $(target).removeClass('chzn-done');
      $(target).html(html);
      html += '<option value="0">' + placeholder + '</option>';

      //init select with filter
      if (product_type) {
        for (var x in data) {
          html += '<option value="' + data[x].name + '">' + data[x].name + '</option>';
        }
        $(target).html(html);
        return false;
      }
      if (limit) {
        for (var x in data) {
          if (data[x].position == limit)
            html += '<option value="' + data[x].id + '">' + data[x].name + '</option>';
        }
        $(target).html(html);
        return false;
      }

      //render select with default select
      if (default_select) {
        for (var x in data) {
          var select = '';
          if (default_select == data[x].id)
            select = 'selected';
          html += '<option value="' + data[x].id + '" ' + select + '>' + data[x].name + '</option>';
        }
        $(target).html(html);
        return false;
      }

      //render select store
      if (store) {
        for (var x in data) {
          html += '<option value="' + data[x].id + '">' + data[x].store_name + '</option>';
        }
        $(target).html(html);
        return false;
      }
      //render select with code product
      if (!code) {
        for (var x in data) {
          html += '<option value="' + data[x].id + '">' + data[x].name + '</option>';
        }
      } else {
        for (var x in data) {
          html += '<option value="' + data[x].code + '">' + data[x].name + '</option>';
        }
      }
      $(target).html(html);
    };
    httpApi.initSelect = function () {
      $(' select').not("select.chzn-select,select[multiple],select#box1Storage,select#box2Storage").selectmenu({
        style: 'dropdown',
        transferClasses: true,
        width: null
      });

      $(".chzn-select").chosen();
    };
    return httpApi;
  })
    .service("OrderPopover", ['$http', function( $http ){
      return {
        init: function( domElement, isBill ) {
          $('.show-popover').popover('hide');
          var inited = $(domElement).data('initpopup');
          if (inited) {
            $(domElement).popover("toggle");
          } else {
            var orderId = $(domElement).data('orderid');
            if (orderId) {
              var url = config.base + '/order/popoverData?id=' + orderId;
              if ( isBill ) {
                url = config.base + '/bill_detail/popoverData?id=' + orderId
              }
              $http.get(url)
                  .success(function (response) {
                    $(domElement).popover({
                      trigger: 'focus',
                      content: response,
                      html: true,

                    });
                    $(domElement).popover("show");
                    $(domElement).data('initpopup', 1);
                  })
            }
          }
        }
      }
    }])
  .service('customers', ['$http', function ($http) {
    return {
      getCustomer: function (customer_id, callback) {
        $http.get(config.base + '/customers/getCustomer?id=' + customer_id)
          .success(function (result) {
            callback(result)
          })
      }
    }
  }])
  .service('$warehouses', ['$http', function ($http) {
    return {
      deleteWarehouses: function (id, warehouses_id, callback) {
        $http.get(config.base + '/warehouses/deleteWarehouses', {
            params: {
              id: id,
              warehouses_id: warehouses_id
            }
          })
          .success(function (result) {
            callback(result)
          })
      }
    }
  }])
  .service('$orders', ['$http', function ($http) {
    return {
      updateOrderInDivide: function (order, callback) {
        $http.post(config.base + '/order/updateOrderInDivide', order)
          .success(function (result) {
            callback(result)
          })
      },
      getOrder: function (order_id, callback) {
        $http.get(config.base + '/order/getOrderDetail', {
            params: {
              order_id: order_id
            }
          })
          .success(function (result) {
            callback(result)
          })
      },
      removeOrderFromShipment: function (order_id, callback) {
        $http.get(config.base + '/order/removeOrderFromShipment', {
            params: {
              order_id: order_id
            }
          })
          .success(function (result) {
            callback(result)
          })
      }
    }
  }])
  .service('$print', ['$http', function ($http) {
    return {
      getTemplatePrintOrder: function (callback) {
        $http.get("/www/partials/temp-print/temp-print-order-detail.html")
          .success(function (data) {
            callback(data)
          });
      },
      getTemplatePrintProductOrder: function (callback) {
        $http.get("/www/partials/temp-print/temp-print-product-order.html")
          .success(function (data) {
            callback(data)
          });
      },
      printContent: function (popupWin, template, callback) {
        popupWin.document.open()
        popupWin.document.write(template);
        popupWin.document.close();
      }
    }
  }]);
