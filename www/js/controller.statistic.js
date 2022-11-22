'use strict';
angular.module('statistic.controllers', ['ui.bootstrap'])
    .controller('SalesStatistic', ['$scope', '$http', '$location', 'showAlert', 'renderSelect', '$filter', 'productService', '$timeout',
        function ($scope, $http) {

            $scope.init = function () {
                var initDate = new Date();
               $scope.totalCost = 0;
                $scope.loadUrl = config.base + '/StatisticController/Sales';
                var params = '';
                if($("input[name=from]").val()) {
                    params = '?from=' + $("input[name=from]").val();
                    if($("input[name=to]").val()) {
                        params += '&to=' + $("input[name=to]").val();
                    }
                }
                $http.get($scope.loadUrl + params)
                    .success(function(data){
                        $scope.statisticData = data.statisticData;
                        $scope.maxLength = data.maxLength;
                        $scope.totalAmount = data.totalAmount;
                        $scope.totalProfit = data.totalProfit;
                        $scope.totalDebit = data.totalDebit;
                        $scope.totalCash = data.totalCash;
                        $scope.from_date = data.from;
                        $scope.to_date = data.to;
                        $scope.totalDiscount = data.totalDiscount;
                        $scope.totalPromotionProductValue = callTotalPromotionValue();
                });
            };

            $scope.init();
            $scope.openFrom = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.fromOpened = true;
            };
            $scope.openTo = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.toOpened = true;
            };
            $scope.getFromDate = function() {
                return $("input[name=from]").val();
            };
            $scope.getToDate = function() {
                return $("input[name=to]").val();
            }
            function callTotalPromotionValue(){
                var amount = 0;
                $.each($scope.statisticData, function(index, value) {
                    $scope.totalCost += value.cost * 1;
                    if(value.promotion) {
                        amount += value.promotionCost / value.promotion.rate * value.promotion.quantity;
                    }
                });
                return Math.round(amount);
            }
        }])
    .controller('BillList', ['$scope', '$http', '$stateParams', function ($scope, $http, $stateParams) {
        $scope.init = function () {
            var params = '?product=' + $stateParams.product;
            params += '&price=' + $stateParams.price;
            params += '&from=' + $stateParams.from;
            params += '&to=' + $stateParams.to;
            $http({
                method: 'GET',
                url: config.base + '/StatisticController/getBillList'+params,
                reponseType: 'json'
            }).success(function (data, status) {
                $scope.bill = data.bill;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
    }])
    .controller('saleCommission', ['$scope', '$http', function( $scope, $http){
        $scope.init = function () {
            $scope.salesCommissions = [];
            $scope.salers = [];
            $scope.listProductType = [];
            $scope.chietKhauSi = 500;
            $scope.chietKhauLe = 1000;

            $http.get(config.base + '/StatisticController/getSaleCommissionMetaData')
                .success(function(data){
                    $scope.salers = data.salers;
                    $scope.listProductType = data.productType;
                    setTimeout(function (){
                        $(".selectpicker[name=category]").selectpicker({
                            selectedTextFormat: 'count',
                            countSelectedText: "{0}/{1} ngành hàng"
                        }).selectpicker('selectAll');
                    })
                });
        };

        $scope.loadData = function () {
            var params = '';
            if($("input[name=from]").val()) {
                params = '?from=' + $("input[name=from]").val();
                if($("input[name=to]").val()) {
                    params += '&to=' + $("input[name=to]").val();
                }
            }
            $http.get(config.base + '/StatisticController/getSalesCommissions' + params)
                .success(function(data){
                    $scope.salesCommissions = data;
                });
        };

        $scope.init();

        $scope.openFrom = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.fromOpened = true;
        };
        $scope.openTo = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.toOpened = true;
        };

        $scope.getFromDate = function() {
            return $("input[name=from]").val();
        };

        $scope.getToDate = function() {
            return $("input[name=to]").val();
        }

        $scope.calcTotalRevenue = function (id) {
            var total = 0;
            $.each($scope.salesCommissions, function ( index, product ){
                if ($scope.filterCategory(product) && product.commissions && product.commissions[id]) {
                    total += parseFloat(product.commissions[id].amount);
                }
            });

            return total;
        }

        $scope.calcTotalSaleCommission = function (id) {
            var total = 0;
            $.each($scope.salesCommissions, function ( index, product ){
                if ($scope.filterCategory(product) && product.commissions && product.commissions[id]) {
                    total += product.commissions[id].wholesale * $scope.chietKhauSi;
                    total += product.commissions[id].retail * $scope.chietKhauLe;
                }
            });

            return total;
        }

        $scope.filterCategory = function (item) {
            return ($scope.category.length == 0 || $scope.category.includes(item.product_type)) && ($scope.includeEmptyRow || item.commissions);
        }
    }])
    .controller('SaleCommissionDetail', ['$scope', '$http', '$stateParams', function ($scope, $http, $stateParams) {
        $scope.init = function () {
            var params = '?product=' + $stateParams.product;
            params += '&from=' + $stateParams.from;
            params += '&saler=' + $stateParams.saler;
            params += '&to=' + $stateParams.to;
            params += '&type=' + $stateParams.type;
            $http({
                method: 'GET',
                url: config.base + '/StatisticController/getSaleCommissionDetail'+params,
                reponseType: 'json'
            }).success(function (data, status) {
                $scope.bill = data.bill;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
    }])
;