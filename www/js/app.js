'use strict';

var dashboard = angular.module('dashboard', [
    'ui.router',
    'ui.bootstrap',
    'dashboard.services',
    'dashboard.filters',
    'dashboard.directives',
    'dashboard.controllers',
    'promotion.controllers',
    'order.controllers',
    'statistic.controllers'
]).config(function ($stateProvider, $urlRouterProvider) {
    //
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/");
    //
    // Now set up the states
    $stateProvider
        .state('dashboard', {
            url: "dashboard",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-dashboard.html'
                }
            },
            controller: 'dashboardController'
        })
        .state('product-type', {
            url: "/product-type",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-create-product-type.html'
                }
            },
            controller: 'productTypeController'
        })
        .state('create-product', {
            url: "/create-product",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-create-product.html'
                }
            },
            controller: 'createProductController'
        })
        .state('product', {
            url: "/product",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-product.html'
                }
            },
            controller: 'productController'
        })
        .state('edit-product', {
            url: "/edit-product/:id",
            views: {
                "content": {
                    templateUrl: ROLE == 1? '/www/partials/temp-create-product.html' : '/www/partials/temp-permission-denied.html'
                }
            },
            controller: 'createProductController'
        })
        .state('warehouse-invoice', {
            url: "/warehouse-invoice/:type",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-warehouse-wholesale.html'
                }
            },
            controller: 'warehouseWholesaleController'
        })
        .state('warehouse', {
            url: "/warehouse/:type",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-warehouse.html'
                }
            },
            controller: 'warehouseController'
        })
        .state('stock-transfer', {
            url: "/stock-transfer",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-stock-transfer.html'
                }
            },
            controller: 'stockTransferController'
        })
        .state('warehouse-sale', {
            url: "/warehouse-sale/:type",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-warehouse-sale.html'
                }
            },
            controller: 'warehouseSaleController'
        })
        .state('bill', {
            url: "/bill/:type",
            views: {
                "content": {
                    templateUrl: ROLE===1? '/www/partials/temp-bill.html' : '/www/partials/temp-permission-denied.html'
                }
            },
            controller: 'billController'
        })
        .state('bill-detail', {
            url: "/bill-detail/:type/:id",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-bill-detail.html'
                }
            },
            controller: 'billDetailController'
        })
        .state('warehouse-divide', {
            url: "/warehouse-divide/:warehousing_id",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-warehouse-divide.html'
                }
            },
            controller: 'warehouseDivideController'
        })
        .state('warehouse-list', {
            url: "/warehouse-list",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' :  '/www/partials/temp-warehouse-list.html'
                }
            },
            controller: 'warehouseListController'
        })
        .state('warehouse-status', {
            url: "/warehouse-status",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-warehouse-status.html'
                }
            },
            controller: 'warehouseStatusController'
        })
        .state('warehouse-outofstorge', {
            url: "/warehouse-outofstorge",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-warehouse-outOfStorge.html'
                }
            },
            controller: 'warehouseOutOfStorgeController'
        })
        .state('total-liability', {
            url: "/total-liability",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-total-liability.html'
                }
            },
            controller: 'totalLiabilityController'
        })
        .state('total-liability-detail', {
            url: "/total-liability-detail/:parner_id",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-total-liability-detail.html'
                }
            },
            controller: 'totalLiabilityController'
        })
        .state('total-debit', {
            url: "/total-debit",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-total-debit.html'
                }
            },
            controller: 'totalDebitController'
        })
        .state('total-debit-customer', {
            url: "/total-debit-customer/:customer_id",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-total-debit-detail.html'
                }
            },
            controller: 'totalDebitController'
        })
        .state('warehousing-history', {
            url: "/warehousing-history",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-warehousing-history.html'
                }
            },
            controller: 'warehousingHistoryController'
        })
        .state('warehousing-detail', {
            url: "/warehousing-detail/:id",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-warehousing-detail.html'
                }
            },
            controller: 'warehousingDetailController'
        })
        .state('warehouses-transfer', {
            url: "/warehouses-transfer",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-warehouses-transfer.html'
                }
            },
            controller: 'warehousesTransferController'
        })
        .state('warehouses-export', {
            url: "/warehouses-export",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-warehouses-export.html'
                }
            },
            controller: 'warehousesExportController'
        })
        .state('export-detail', {
            url: "/export-detail/:id",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-export-detail.html'
                }
            },
            controller: 'exportDetailController'
        })
        .state('customers', {
            url: "/customers/:type",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-customers.html'
                }
            },
            controller: 'customersController'
        })
        .state('order-create', {
            url: "/order-create",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-order-create.html'
                }
            },
            controller: 'createOrderController'
        })
        .state('order-management', {
            url: "/order-management",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-order-management.html'
                }
            },
            controller: 'managementOrderController'
        })
        .state('order-divide', {
            url: "/order-divide/:shipment_id",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-order-divide.html'
                }
            },
            controller: 'divideOrderController'
        })
        .state('order-status', {
            url: "/order-status",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-order-status.html'
                }
            },
            controller: 'statusOrderController'
        })
        .state('order-return', {
            url: "/order-return/:order_id",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-order-return.html'
                }
            },
            controller: 'returnOrderController'
        })
        .state('order-return-half', {
            url: "/order-return-half/:order_id/:shipment_id",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-order-return-half.html'
                }
            },
            controller: 'returnOrderHalfController'
        })
        .state('trucks', {
            url: "/trucks",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-trucks.html'
                }
            },
            controller: 'trucksController'
        })
        .state('staff', {
            url: "/staff",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-staff.html'
                }
            },
            controller: 'staffController'
        })
        .state('staff-create', {
            url: "/staff-create",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-staff-create.html'
                }
            },
            controller: 'createStaffController'
        })
        .state('staff-edit', {
            url: "/staff-edit/:id",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-staff-create.html'
                }
            },
            controller: 'createStaffController'
        })
        .state('order-list', {
            url: "/order-list",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-order-list.html'
                }
            },
            controller: 'listOrderController'
        })
        .state('order-detail', {
            url: "/order-detail",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-order-create.html'
                }
            },
            controller: 'createOrderController'
        })
        .state('users', {
            url: "/users",
            views: {
                "content": {
                    templateUrl: ROLE == 1? '/www/partials/temp-user-list.html' : '/www/partials/temp-permission-denied.html'
                }
            },
            controller: 'listUserController'
        })
        .state('shipment', {
            url: "/shipment",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-shipment.html'
                }
            },
            controller: 'shipmentController'
        })
        .state('shipment-detail', {
            url: "/shipment-detail/:shipment_id",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-shipment-detail.html'
                }
            },
            controller: 'shipmentDetailController'
        })
        .state('promotion-board', {
            url: "/promotion-board",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/promotion/temp-promotion-board.html'
                }
            },
            controller: 'promotionBoardController'
        })
        .state('promotion-create', {
            url: "/promotion-create",
            views: {
                "content": {
                    templateUrl: ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/promotion/temp-promotion-create.html'
                }
            },
            controller: 'promotionCreateController'
        })
        .state('product-unit', {
            url: "/product-unit",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-product-unit.html'
                }
            },
            controller: 'ProductUnit'
        })
        .state('sales-statictis', {
            url: "/statistic/sales",
            views: {
                "content": {
                    templateUrl:  ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/statistic/temp-sales-statistic.html'
                }
            },
            controller: 'SalesStatistic'
        })
        .state('sales-statictis-bill-list', {
            url: "/statistic/bill-list/:from/:to/:product/:price",
            views: {
                "content": {
                    templateUrl:  ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/statistic/temp-bill-list.html'
                }
            },
            controller: 'BillList'
        })
        .state('retail', {
            url: "/retail",
            views: {
                "content": {
                    templateUrl: '/www/partials/temp-retail.html'
                }
            },
            controller: 'Retail'
        })
        .state('import-detail', {
            url: "/import/detail/:id",
            views: {
                "content": {
                    templateUrl:  ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-import-detail.html'
                }
            },
            controller: 'importDetailController'
        })
        .state('print-debit', {
            url: "/debit/print/:id",
            views: {
                "content": {
                    templateUrl:  ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/temp-debit-printing.html'
                }
            },
            controller: 'printingDebitController'
        })
        .state('sales-commission', {
            url: "/sales-commission",
            views: {
                "content": {
                    templateUrl:  ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/salesCommission.html'
                }
            },
            controller: 'printingDebitController'
        })
        .state('sale-commission-detail', {
            url: "/statistic/sale-commission-detail/:saler/:from/:to/:product/:type",
            views: {
                "content": {
                    templateUrl:  ROLE !== 1? '/www/partials/temp-permission-denied.html' : '/www/partials/statistic/temp-sale-commission-detail.html'
                }
            },
            controller: 'BillList'
        })
})
    .service('productService', function ($http) {
        this.getProducts = function () {
            return $http.get(config.base + '/products/getAllWithUnit').then(function (response) {
                return response.data;
            });
        };
        this.getUnits = function () {
            return $http.get(config.base + '/products/getUnits').then(function (response) {
                return response.data;
            });
        };
        this.getProductTypes = function () {
            return $http.get(config.base + '/products/createProductView').then(function (response) {
                return response.data;
            });
        };
        this.getCustomers = function () {
            return $http.get(config.base + '/customers/getAll').then(function (response) {
                return response.data;
            });
        };
        this.prepareProductName = function (products, units, isPrimUnit) {
            if (products != undefined) {
                for (var i = 0; i < products.length; i++) {
                    if (isPrimUnit) {
                        products[i].name = this.createProductName(products[i].name, products[i].primary_unit, units);
                    }
                    else {
                        products[i].name = this.createProductName(products[i].name, products[i].sale_unit, units);
                    }
                }
            }
            return products;
        };

        this.createProductName = function (originalName, unitId, units) {
            var unit = this.findProductUnit(units, unitId);
            var newName = angular.copy(originalName);
            if (unit != undefined && unit.is_prefix == 1) {
                newName = unit.name + ' ' + originalName;
            }
            return newName
        };

        this.findProductUnit = function (units, id) {
            var result = undefined;
            for (var i = 0; i < units.length; i++) {
                if (units[i].id == id) {
                    result = units[i];
                    break;
                }
            }
            return result;
        };

        this.getProductNameById = function (id, lstProduct) {
            var result = '';
            for (var i = 0; i < lstProduct.length; i++) {
                if (lstProduct[i].id == id) {
                    result = lstProduct[i].name;
                    break;
                }
            }
            return result;
        };
        this.sum = function (items, quantity, value) {
            return items.reduce(function (a, b) {
                return a + parseInt(b[quantity]) * parseInt(b[value]);
            }, 0);
        };
        this.formatDate = function (date) {
            var d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;

            return [year, month, day].join('-');
        };

        this.printElement = function (elem, append, delimiter) {
            var domClone = elem.cloneNode(true);

            var $printSection = document.getElementById("printSection");

            if (!$printSection) {
                var $printSection = document.createElement("div");
                $printSection.id = "printSection";
                document.body.appendChild($printSection);
            }

            if (append !== true) {
                $printSection.innerHTML = "";
            }

            else if (append === true) {
                if (typeof(delimiter) === "string") {
                    $printSection.innerHTML += delimiter;
                }
                else if (typeof(delimiter) === "object") {
                    $printSection.appendChlid(delimiter);
                }
            }

            $printSection.appendChild(domClone);
        };
    })
    .run(function ($rootScope) {
        $rootScope.isAdminRole = function () {
            return ROLE === 1;
        };
    });