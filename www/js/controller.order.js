'use strict';
angular.module('order.controllers', ['ui.bootstrap'])
    .controller('createOrderController', ['$scope', '$http', '$location', 'showAlert', 'renderSelect', '$filter', 'productService', '$timeout',
        function ($scope, $http, $location, showAlert, renderSelect, $filter, productService, $timeout) {
            $scope.selectingorderproducts = [];
            $scope.init = function () {
                //console.log('init13: ');
                $scope.currentId = $location.search().i;
                $scope.lstOrderProduct = [];
                $scope.totalQuantity = 0;
                $scope.lstUser = [];
                $scope.currentUserDebit = 0;
                $scope.saveprocessing = false;
                $scope.addMoreProcessing = 0;
                $scope.isLoadedCustomer = false;
                var d = new Date();
                $scope.currentDate = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
                setDefaultValue();
                $http.get(config.base + '/customers/getAll').then(function (response) {
                    $scope.lstCustomer = response.data;
                    $timeout(function () {
                        $("#select-customer").selectpicker();
                        $timeout(function () {
                            if ($scope.selectedCus) {
                                $("#select-customer").selectpicker('refresh')
                                $scope.selectCustomer();
                            }
                        });
                    })
                });
                $http.get(config.base + '/staff/getAll').then(function (response) {
                    $scope.lstUser = response.data.user;
                    $scope.isLoadedCustomer = true;
                    $timeout(function () {
                        $("#select-user").selectpicker('refresh');
                    })
                });
                var objGetProducts = productService.getProducts();
                objGetProducts.then(function (data) {
                    $scope.danhSachDonVi = data.units;
                    $scope.danhSachSanPhamPrim = angular.copy(data.products);
                    $scope.danhSachSanPham = productService.prepareProductName(data.products, data.units, false);
                    if ($scope.currentId != undefined) {
                        loadOrder();
                    } else {
                        $scope.lstOrderProduct.push({
                            'id': '',
                            'product': '',
                            'cost': null,
                            'price': 0,
                            'sys_price': 0,
                            'quantity': null
                        });
                    }
                    $timeout(function () {
                        $(".selectpicker").selectpicker();
                        // $(".selectpicker").focus(function(){
                        //     $(this).selectpicker('toggle');
                        // });

                        $('.selectpicker').on("shown.bs.select", function() {
                            $(this).parent().find(".bs-searchbox input").focus();
                        });

                        $('.list_order_product .product_order:last-child .selectpicker').on("changed.bs.select", function() {
                            $(this).parents('tr').find("td:nth-child(2) input").focus();
                        });
                        // chọn kh
                        // $("#select-customer").on("changed.bs.select", function() {
                        //     setTimeout(function (){
                        //         $("#select-user").selectpicker('toggle');
                        //     })
                        // });
                        
                        // $("#select-user").on("changed.bs.select", function() {
                        //     setTimeout(function (){
                        //         $('.list_order_product .product_order:last-child .selectpicker').selectpicker('toggle');
                        //     })

                        // });
                    })
                });

            };

            function setDefaultValue() {

                $scope.totalValue = 0;
                $scope.totalPromotion = 0;
                $scope.lstPromotion = [];
                $scope.order = {};
                $scope.order.note = '';
                $scope.searchCustomer = '';
                $scope.customer_print = '';
                $scope.order_id_print = '';
                $scope.isEditing = true;
                $scope.order.lstProId = [];
                $scope.selectedCus = 0;
                $scope.selectedUser = 0;
                $scope.currentUserDebit = {};
                $scope.currentCustomer = null;
                $scope.totalbox = 0;
            }

            $scope.init();
            $scope.printOrder = function () {
                var popupWin = window.open('', '_blank', 'width=700');
                var printHtml = '<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="http://npptuanmai.com/www/css/bootstrap.min.css" /></head><body onload="window.print(); window.close()" style="width: 559px">';
                printHtml += $("#print-area").html();
                printHtml += '</body></html>';
                popupWin.document.open()
                popupWin.document.write(printHtml);
                popupWin.document.close();
            }
            $scope.selectCustomer = function () {
                //console.log('select12');
                if ($scope.selectedCus) {
                    $scope.currentCustomer = setCustomer();
                    if($scope.selectedCus) {
                        $http.get(config.base + '/Debit/customerDebit?i=' + $scope.selectedCus).success(function (data, status) {
                            $scope.currentUserDebit = data.debit;
                        })
                    }
                    setTimeout(function (){
                        $("#select-user").selectpicker('toggle');
                    })
                }
            };
            $scope.selectSaler = function () {
                setTimeout(function (){
                     $('.list_order_product .product_order:last-child .selectpicker').selectpicker('toggle');
                })
               //console.log('selec saler123');
            };
            $scope.selectUnit = function () {
                var target_id = $(event.currentTarget).closest('tr').data('id');
                $scope.units.forEach(function (unit) {
                    if (unit.id === $('#tr_order_' + target_id).children('td:nth-child(5)').children('select.load_unit').val()) {
                        $('#tr_order_' + target_id).children('td:nth-child(6)').children('input.show_sale').val(numeral(parseInt(unit.price)).format('0,0'));
                        $('#tr_order_' + target_id).children('td:nth-child(6)').children('input.show_sale_origin').val(unit.price);
                        $('#tr_order_' + target_id).children('td:nth-child(6)').children('input.show_sale_origin').attr('data-sale-id', unit.id);
                    }
                });
            };
            $scope.calculatorPrice = function () {
                var total = 0;
                $scope.totalQuantity = 0;
                $scope.totalbox = 0;
                for (var i = 0; i < $scope.lstOrderProduct.length; i++) {
                    var subTotal = $scope.lstOrderProduct[i].price * $scope.lstOrderProduct[i].quantity;
                    $scope.totalQuantity += $scope.lstOrderProduct[i].quantity;
                    total += subTotal;
                    $scope.totalbox += getboxnum($scope.lstOrderProduct[i].product) * $scope.lstOrderProduct[i].quantity;
                }
                $scope.totalValue = total;
                calPromotionValue();
            };

            function getboxnum (proid) {
                for (var i=0; i<$scope.danhSachSanPham.length; i++) {
                    if ($scope.danhSachSanPham[i].id == proid) {
                        return $scope.danhSachSanPham[i].numbox;
                    }
                }
                return 1;
            }

            $scope.moreOrder = function () {
                if ( $scope.addMoreProcessing == 1) return false;
                $scope.addMoreProcessing = 1;
                $scope.lstOrderProduct.push({
                    'id': '',
                    'product': '',
                    'cost': null,
                    'price': null,
                    'quantity': null
                });
                setTimeout(function () {
                    $('.list_order_product .product_order:last-child .selectpicker').selectpicker();
                    $('.list_order_product .product_order:last-child .selectpicker').on("shown.bs.select", function() {
                       $(this).parent().find(".bs-searchbox input").focus();
                    });
                    $('.list_order_product .product_order:last-child .selectpicker').on("changed.bs.select", function() {
                        $(this).parents('tr').find("td:nth-child(2) input").focus();
                    });
                    $('.list_order_product .product_order:last-child .selectpicker').selectpicker('toggle');
                    setTimeout(function(){
                        $scope.addMoreProcessing = 0;
                    });
                }, 1000);
            };
            $scope.saveOrder = function () {
                $scope.saveprocessing = true;
                if (!$scope.currentCustomer) {
                    bootbox.alert("Vui lòng chọn khách hàng");
                    $scope.saveprocessing = false;
                    return false;
                }
                if (!$scope.selectedUser) {
                    bootbox.alert("Vui lòng chọn saler");
                    $scope.saveprocessing = false;
                    return false;
                }
                var orders = new Array();
                for (var i = 0; i < $scope.lstOrderProduct.length; i++) {
                    if ($scope.lstOrderProduct[i].product) {
                        var order = {
                            product_id: $scope.lstOrderProduct[i].product,
                            cost: $scope.lstOrderProduct[i].cost,
                            unit: '',
                            price: $scope.lstOrderProduct[i].price,
                            quantity: $scope.lstOrderProduct[i].quantity,
                            total: $scope.lstOrderProduct[i].product
                        };
                        orders.push(order);
                    } else {
                        bootbox.alert("Vui lòng chọn sản phẩm");
                        $scope.saveprocessing = false;
                        return false;
                    }
                }
                if ($scope.currentId != undefined) {
                    $scope.order.id = $scope.currentId;
                }

                $scope.order.orders = orders;
                $scope.order.total_price = $scope.totalValue;
                $scope.order.customer_id = $scope.currentCustomer.id;
                $scope.order.saler = $scope.selectedUser;
                var url = config.base;
                url += ($scope.currentId == undefined) ? '/order/addOrder' : '/order/update';
               //console.log('body: ', $scope.order);
                $http({
                    method: 'POST',
                    url: url,
                    data: $scope.order,
                    responseType: 'json'
                }).success(function (data, status) {
                    //console.log('data: ', data);
                    showAlert.showSuccess(3000, 'Lưu thành công');
                    if ( $scope.currentId ) {
                        setTimeout(function(){
                            window.location.href = config.base + '/dashboard#order-list';
                        }, 1000);
                    } else {
                        $scope.init();
                        $('#select-customer').val("");
                        $('#select-customer').selectpicker("refresh");
                        $('#select-user').val("");
                        $('#select-user').selectpicker("refresh");
                        $scope.saveprocessing = false;
                        
                    }
                }).error(function (data, status) {
                    console.log(data);
                    $scope.saveprocessing = false;
                });
                $scope.saveprocessing = false;
            };

            $scope.checkPromotion = function () {
                var postData = {"totalValue": $scope.totalValue, "detail": []};
                for (var i = 0; i < $scope.lstOrderProduct.length; i++) {
                    postData.detail.push({
                        "id": $scope.lstOrderProduct[i].product,
                        "quantity": $scope.lstOrderProduct[i].quantity
                    });
                }
                $scope.lstPromotion = [];
                $http.post(config.base + '/promotion/getByOrder', postData).then(function (response) {
                    preparePromotion(response.data);
                    calPromotionValue();
                }, function (error) {
                });
            };

            $scope.deletePromotion = function (index, subIndex) {
                $scope.lstPromotion[index].detail.splice(subIndex, 1);
                if ($scope.lstPromotion[index].detail.length == 0) {
                    $scope.lstPromotion.splice(index, 1);
                }
                $scope.calculatorPrice();
            }

            $scope.deleteProduct = function (index) {
                $scope.lstOrderProduct.splice(index, 1);
                $scope.calculatorPrice();
            };
            $scope.getUnitName = function (id) {
                var unit = '';
                for (var j = 0; j < $scope.danhSachDonVi.length; j++) {
                    if ($scope.danhSachDonVi[j].id == id) {
                        unit = $scope.danhSachDonVi[j].name;
                        break;
                    }
                }
                return unit;
            };
            $scope.getProductName = function (id) {
                return productService.getProductNameById(id, $scope.danhSachSanPhamPrim)
            };
            $scope.getProductUnit = function (id) {
                var unit = '';
                for (var i = 0; i < $scope.danhSachSanPhamPrim.length; i++) {
                    if ($scope.danhSachSanPhamPrim[i].id == id) {
                        unit = $scope.getUnitName($scope.danhSachSanPhamPrim[i].primary_unit);
                        break;
                    }
                }
                return unit;
            };
            $scope.getSalerName = function () {
                var name = '';
                if ($scope.selectedUser) {
                    for (var i = 0; i < $scope.lstUser.length; i++) {
                        if ($scope.lstUser[i].id == $scope.selectedUser) {
                            name = $scope.lstUser[i].name;
                            break;
                        }
                    }
                }
                return name;
            };
            $scope.notEmptyRow = function (lst) {
                return function (item) {
                    return item.product != '';
                }
            };

            function preparePromotion(lstPromotion) {
                for (var i = 0; i < lstPromotion.length; i++) {
                    var firstPro = lstPromotion[i][0].data;
                    var objPro = {'display': firstPro.name, 'detail': []};
                    for (var j = 0; j < lstPromotion[i].length; j++) {
                        var pro = lstPromotion[i][j].data;
                        var objTemp = {
                            'display': '',
                            'data': pro,
                            'title': '',
                            'unit': '',
                            'quantity': parseInt(lstPromotion[i][j].quantity),
                            'value': '',
                            'totalValue': ''
                        };
                        if (pro.percent_discount > 0) {
                            objTemp.display = "Chiết khấu " + pro.percent_discount + " %";
                            objTemp.title = 'Chiết khấu';
                            objTemp.unit = '%';
                            objTemp.quantity = parseInt(pro.percent_discount) * objTemp.quantity;
                        } else if (pro.money_discount > 0) {
                            objTemp.display = "Chiết khấu " + pro.money_discount + " nghìn đồng";
                            objTemp.title = 'Chiết khấu';
                            objTemp.unit = 'Xuất';
                        } else if (pro.other_gift != null && pro.other_gift != '') {
                            objTemp.display = 'Tặng ' + pro.other_gift;
                            objTemp.title = pro.other_gift;
                        } else if (pro.product_gift > 0) {
                            var productOriginalName = productService.getProductNameById(pro.product_gift, $scope.danhSachSanPhamPrim);
                            var giftName = productService.createProductName(productOriginalName, pro.product_gift_unit, $scope.danhSachDonVi);
                            objTemp.display = ' Tặng ' + pro.product_gift_no + ' ' + giftName;
                            objTemp.title = productOriginalName;
                            objTemp.unit = $scope.getUnitName(pro.product_gift_unit);
                            objTemp.unit_id = pro.product_gift_unit;
                            objTemp.quantity = parseInt(pro.product_gift_no) * objTemp.quantity;
                        }

                        objPro.detail.push(objTemp);
                    }
                    $scope.lstPromotion.push(objPro);
                }
            }

            $scope.editNumberPromotion = function () {
                calPromotionValue();
            };

            $scope.productChange = function (index) {
                for (var i = 0; i < $scope.danhSachSanPham.length; i++) {
                    if ($scope.danhSachSanPham[i].id == $scope.lstOrderProduct[index].product) {
                        if ($scope.danhSachSanPham[i].price != null) {
                            $scope.lstOrderProduct[index].price = parseInt($scope.danhSachSanPham[i].price);
                        }
                        break;
                    }
                }
                $scope.calculatorPrice();
                $('.selectpicker').selectpicker('refresh');
            }

            function calPromotionValue() {
                var moneyValue = 0;
                var percentValue = 0;
                $scope.totalPromotion = 0;
                $scope.order.lstProId = [];
                for (var i = 0; i < $scope.lstPromotion.length; i++) {
                    for (var j = 0; j < $scope.lstPromotion[i].detail.length; j++) {
                        var detail = $scope.lstPromotion[i].detail[j];
                        moneyValue = 0;
                        percentValue = 0;
                        moneyValue = parseInt(detail.data.money_discount);
                        percentValue = (detail.data.percent_discount > 0) ? detail.quantity : detail.data.percent_discount;
                        $scope.order.lstProId.push({
                            'id': detail.data.id,
                            'quantity': detail.quantity,
                            'unit_id': detail.unit_id
                        });
                        var percent = $scope.totalValue / 100;
                        if (moneyValue > 0) {
                            $scope.lstPromotion[i].detail[j].value = moneyValue;
                            $scope.lstPromotion[i].detail[j].totalValue = moneyValue * $scope.lstPromotion[i].detail[j].quantity;
                        } else if (percentValue > 0) {
                            $scope.lstPromotion[i].detail[j].value = percent;
                            $scope.lstPromotion[i].detail[j].totalValue = Math.round(percent * percentValue);

                        }
                        $scope.totalPromotion += $scope.lstPromotion[i].detail[j].totalValue;
                    }
                }
            }

            function loadOrder() {
                //console.log('123123');
                $http.get(config.base + '/order/get?i=' + $scope.currentId).then(function (response) {
                    for (var i = 0; i < response.data.order_detail.length; i++) {
                        $scope.lstOrderProduct.push({
                            'id': response.data.order_detail[i].id,
                            'product': response.data.order_detail[i].product_id,
                            'cost': parseInt(response.data.order_detail[i].cost),
                            'price': parseInt(response.data.order_detail[i].price),
                            'quantity': parseInt(response.data.order_detail[i].quantity)
                        });
                    }

                    preparePromotion(response.data.promotions);
                    $scope.calculatorPrice();
                    $scope.order.note = response.data.note;
                    $scope.selectedUser = response.data.saler;
                    $scope.selectedCus = response.data.customer_id;
                    $timeout(function () {
                        $("#select-user").selectpicker('refresh');
                        $("#select-customer").selectpicker('refresh');
                        $scope.selectCustomer();
                        $(".product.selectpicker").selectpicker();
                    });
                }, function (response) {
                    console.log(response);
                });
            }

            function setCustomer() {
                //console.log('customer: ', $scope.lstCustomer)
                if ($scope.lstCustomer != undefined) {
                    for (var i = 0; i < $scope.lstCustomer.length; i++) {
                        if ($scope.lstCustomer[i].id == $scope.selectedCus) {
                            return $scope.lstCustomer[i];
                        }
                    }
                }
            }

            $scope.productSelectFilter = function(index) {
                return function(item) {
                    var isduplicate = false;
                    for(var i = 0; i < $scope.lstOrderProduct.length; i++) {
                        if (i != index && item.id == $scope.lstOrderProduct[i].product) {
                            isduplicate = true;
                            break;
                        }
                    }
                    return !isduplicate;
                }
            }

            $scope.shouldWarningPrice = function ( saleItem ) {
                var sys_price = 0;
                $.each($scope.danhSachSanPhamPrim, function(index, item) {
                    if (item.id == saleItem.product) {
                        sys_price = item.price;
                    }
                });

                return Math.abs( parseFloat(sys_price) - parseFloat( saleItem.price)) > 5000;
            }
        }])
    .controller('managementOrderController', ['$scope', '$http', 'showAlert', '$location', 'renderSelect', 'productService', '$timeout', 'OrderPopover', function ($scope, $http, showAlert, $location, renderSelect, productService, $timeout, OrderPopover) {
            $scope.orders = new Array();
            $scope.order_tmp = new Array();
            $scope.shipments = new Array();
            $scope.dateOpened = false;
            $scope.newDate = '2017-11-12';
            $scope.date = new Date();
            $scope.trucks = [];
            $scope.currentShipment = {};
            $scope.selectedTruck = {};
            $scope.errorSelectOrder = false;
            $scope.lstShipmentTruck = [];
            $scope.numberofbox = 0;
            $scope.lastIndex = 1;
            $scope.isShipementChanged = false;
            $scope.init = function () {
                $http.get(config.base + '/order/managementOrder')
                    .success(function (data, status) {
                        $scope.orders = data.orders;
                        $scope.trucks = data.trucks;
                    })
            };
            $scope.init();

            $scope.selectOrder = function ($event, back) {
                if ($scope.currentShipment.id === undefined) {
                    $scope.errorSelectOrder = true;
                    return false;
                }
                $scope.isShipementChanged = true;
                var order_id = $($event.currentTarget).data('id');
                if (back) {
                    for (var x in $scope.shipments) {
                        if ($scope.shipments[x].id == order_id) {
                            $scope.orders.push($scope.shipments[x]);
                            $scope.shipments.splice(x, 1);
                            break;
                        }
                    }

                } else {
                    for (var x in $scope.orders) {
                        if ($scope.orders[x].id == order_id) {
                            $scope.order_tmp.push($scope.orders[x]);
                            $scope.shipments.push($scope.orders[x]);
                            $scope.orders.splice(x, 1);
                            break;
                        }
                    }
                }
                countBox();
            };

            $scope.selectTruck = function (id, name) {
                resetSelectedOrders();
                $scope.selectedTruck = {id: id, name: name};
                $http.get(config.base + '/order/getByTruck?i=' + id)
                    .success(function (response, status) {
                        $scope.lstShipmentTruck = response.shipment;
                        $scope.lastIndex = parseInt(response.lastIndex);
                        $scope.shipments = [];
                        $(".truck.btn-warning").removeClass('btn-warning').addClass('btn-success');
                        $('#truck-' + id).removeClass('btn-success').addClass('btn-warning');
                        $scope.currentShipment = {};
                    });
            };
            $scope.divideProduct = function () {
                var shipment_id = $scope.saveShipment(true);
            };
            $scope.selectChuyen = function (id, index) {
                checkShipmentChange();
                $scope.orders = [];
                $http.get(config.base + '/order/managementOrder')
                    .success(function (data, status) {
                        $scope.orders = data.orders;
                    })
                if (!id) $scope.shipments = [];
                else {
                    $http.get(config.base + '/order/getOrderByShipment?i=' + id)
                        .success(function (response, status) {
                            $scope.shipments = response;
                            countBox();
                        });
                }
                $scope.currentShipment = {id: id, index: index};
                $scope.errorSelectOrder = false;
            };
            $scope.saveShipment = function (redirect) {
                var result = undefined;
                $http.post(config.base + '/order/createShipment',
                    {
                        order: $scope.shipments,
                        id: $scope.currentShipment.id,
                        truck: $scope.selectedTruck.id,
                        date: $scope.newDate,
                        index: $scope.currentShipment.index
                    })
                    .success(function (data, status) {
                        if ( data.shipment_id ) {
                            $scope.currentShipment.id = data.shipment_id;
                        }
                        $scope.isShipementChanged = false;
                        showAlert.showSuccess(3000, 'Lưu thành công');
                        if (redirect) {
                            $location.path('order-divide/' + data.shipment_id);
                        }
                    })
                    .error(function (data, status) {
                        console.log(data);
                    });
                return result;
            };

            function checkShipmentChange() {
                if( $scope.isShipementChanged ) {
                    var r = window.confirm("Lưu dữ liệu chuyến xe hiện tại?\nClick [ OK ] để lưu\nClick [ Cancel ] hoặc [ Hủy ] để để không lưu");
                    if ( r == true ) {
                        $scope.saveShipment( false );
                        setTimeout(function (){
                            $scope.selectTruck($scope.selectedTruck.id, $scope.selectedTruck.name);
                        });
                    }
                }
                $scope.isShipementChanged = false;
            }

            $scope.newShipment = function () {
                checkShipmentChange();
                $scope.newDate = productService.formatDate(Date.now()) + ' 00:00:00';
                var newindex = getLastIndex($scope.newDate);
                $scope.lstShipmentTruck.push({
                    id: 0,
                    truck_id: $scope.selectedTruck.id,
                    truck_name: $scope.selectedTruck.name,
                    index: newindex,
                    date: $scope.newDate,
                    status: 0
                });
                $scope.selectChuyen(0, newindex);
            };
            $scope.displayDate = function (date) {
                return productService.formatDate(date);
            }
            function getLastIndex(date) {
                var index = 1;
                $.each($scope.lstShipmentTruck, function (key, value) {
                    if (value.date == date && value.index >= index) {
                        index = parseInt(value.index) + 1;
                    }
                });
                if ( index > $scope.lastIndex) {
                    return index;
                } else {
                    return $scope.lastIndex + 1;
                }
            }
            function resetSelectedOrders() {
                for (var x in $scope.shipments) {
                    $scope.orders.push($scope.shipments[x]);
                    $scope.shipments.splice(x, 1);
                }
            }
            function countBox() {
                $scope.numberofbox = 0;
                if($scope.shipments) {
                    $.each($scope.shipments, function(index, order) {
                        $scope.numberofbox += order.total_box;
                    });
                }
            }

            $scope.showPopover = function(dom){
                OrderPopover.init(dom, false);
            }
        }]
    )
    .controller('divideOrderController', ['$scope', '$http', '$stateParams', 'showAlert', '$location', '$orders', 'renderSelect', '$timeout', '$print', '$interpolate',
        function ($scope, $http, $stateParams, showAlert, $location, $orders, renderSelect, $timeout, $print, $interpolate) {
            $scope.init = function (loadSelectBox) {
                $http({
                    method: 'GET',
                    url: config.base + '/order/divideOrder?shipment_id=' + $stateParams.shipment_id,
                    responseType: 'json'
                }).success(function (data, status) {
                    if (data.shipment.status > 1)
                       window.location = config.base + '/dashboard/page404';
                    //$scope.products = data.products;
                    $scope.orderList = data.orderList
                    $scope.productList = data.productList
                    $scope.warehouses = data.warehouses
                    $scope.shipment.info = data.shipment
                    $scope.other_shipment = data.other_shipment

                    callCustomerTotalProduct();

                    $scope.shipment.info.date = new Date($scope.shipment.info.date);
                    for (var i = 0; i < data.trucks.length; i++) {
                        if (data.trucks[i].id == $scope.shipment.info.truck_id) {
                            $scope.shipment.info['truck_name'] = data.trucks[i].name;
                            break;
                        }
                    }

                    var html = '';
                    $("#lst-chuyen").html(html);
                    $.each($scope.other_shipment, function (index, value) {
                        var html = '';
                        var arrDate = value.date == null ? ['', ' : '] : value.date.split(" ");
                        var arrTime = arrDate[1].split(":");
                        html += '<div class="col-sm-12" style="padding: 10px"><div style="cursor: pointer;color: #337ab7;" onclick="changeShipment(' + value.id + ')">Xe ' + value.truck_name + ' ' + arrDate[0] + ' - Chuyến ' + value.index + '</div></div>';
                        $("#lst-chuyen").append(html);
                    });
                    //convert to int
                    $.each($scope.orderList, function (i, value) {
                        $.each(value.order_detail, function (j, product) {
                            $scope.orderList[i].order_detail[j].quantity = parseInt(product.quantity);
                        })
                    })

                    if (loadSelectBox) {
                        $scope.trucks = data.trucks
                        $scope.staffs = data.staffs
                        $scope.shipment.truck_id = $scope.shipment.info.truck_id;
                        $scope.shipment.driver = $scope.shipment.info.driver;
                        $scope.shipment.sub_driver = $scope.shipment.info.sub_driver;
                        $timeout(function () {
                            var colModal = []
                            $('#divide-product-order th').each(function (key) {
                                if (key == 0)
                                    colModal.push({
                                        width: 150,
                                        align: 'left'
                                    })
                                else if (key == 1 || $(this).hasClass('warehouse-col'))
                                    colModal.push({
                                        width: 30,
                                        align: 'center'
                                    })
                                else
                                    colModal.push({
                                        width: 60,
                                        align: 'center'
                                    })
                            });
                            $('.selectpicker').selectpicker();
                            $("#taixe").selectpicker('val', $("#taixe option:contains('" + $scope.shipment.driver + "')").val());
                            var loxe = [];
                            for ( var i=0; i < $scope.shipment.sub_driver.length; i++) {
                                loxe.push( $("#taixe option:contains('" + $scope.shipment.sub_driver[i] + "')").val() )
                            }
                            $(".loxe").selectpicker('val', loxe);
                            $('.selectpicker').selectpicker('refresh');
                        });
                    }

                    setTimeout(function(){
                        if( $scope.shipment.info.status == 1 ) $("input, select, button, a.uibutton").prop('disabled', true);
                    })
                }).error(function (data, status) {
                    console.log(data);
                });
            };
            $scope.date = new Date();
            $scope.shipment = {}
            $scope.print = {}
            $scope.init(true);
            $scope.checkList = [];
            $scope.selectedShipment = '';
            $scope.updateQuantity = function (product_id, order_id, key_product) {
                var quantity = this.productQuantity
                var orders = {
                    order_id: order_id,
                    product_id: product_id,
                    quantity: quantity
                }
                if (isNaN(quantity)) {
                    alert("vui lòng nhập số");
                    return false;
                }

                $orders.updateOrderInDivide(orders, function (result) {
                    var order_quantity = 0;
                    $('.order_id_' + order_id + ' input').each(function () {
                        if (this.value != '')
                            order_quantity += parseInt(this.value)
                    })
                    var product_quantity = 0
                    $('.product_id_' + product_id + ' input').each(function () {
                        if (this.value != '')
                            product_quantity += parseInt(this.value)
                    })
                    var total_product_quantity = 0;
                    $('#divide-product-order tbody td:nth-child(2)').not('tr:nth-child(1) td').each(function () {
                        if ($(this).text().trim() != '')
                            total_product_quantity += parseInt($(this).text())
                    })
                    $scope.productList[0]['total_quantity'] = total_product_quantity
                    $scope.productList[key_product]['total_quantity'] = product_quantity
                    $scope.productList[0]['detail'][order_id] = order_quantity
                })
            }

            $scope.printOrderDetail = function (order_id) {
                $orders.getOrder(order_id, function (result) {
                    $print.getTemplatePrintOrder(function (template) {
                        var html = ''
                        $scope.print.orderCode = result.order_code
                        $scope.print.totalQuantity = 0
                        $scope.print.totalPrice = 0
                        $.each(result.order_detail, function (key, order) {
                            html += '<tr>'
                            html += '<td>' + (key + 1) + '</td>'
                            html += '<td>' + order.product_name + '</td>'
                            html += '<td>' + order.quantity + '</td>'
                            html += '<td>' + numeral(order.price).format('0,0') + '</td>'
                            html += '<td>' + numeral(order.total).format('0,0') + '</td>'
                            html += '</tr>'

                            $scope.print.totalQuantity += parseInt(order.quantity);
                            $scope.print.totalPrice += parseInt(order.total)
                        })
                        $scope.print.totalPrice = numeral($scope.print.totalPrice).format('0,0');
                        $scope.print.totalDebit = numeral(result.customer_detail.debit).format('0,0');
                        $scope.print.orderDetail = html;
                        $scope.print.dateOrder = result.created;
                        $scope.print.customer = {
                            name: result.customer_detail.store_name,
                            address: result.customer_detail.address,
                            phone: JSON.parse(result.customer_detail.phone_mobile)[0]
                        }
                        var popupWin = window.open('', '_blank', 'width=80');
                        $print.printContent(popupWin, $interpolate(template)($scope.print))
                    })
                })
            }
            $scope.printProductList = function () {
                $scope.saveOrder();

                $print.getTemplatePrintProductOrder(function (template) {
                    var html = ''
                    $.each($scope.productList.detail, function (key, product) {
                        // if (key != 0) {
                        html += '<tr>'
                        html += '<td>' + key + '</td>';
                        html += '<td>' + product.product_name + '</td>';
                        html += '<td>' + product.total_quantity + '</td>';
                        html += '</tr>';
                        // }
                    });
                    $scope.print.productList = html;
                    var popupWin = window.open('', '_blank', 'width=80');
                    var template = $interpolate(template)($scope.print);
                    $print.printContent(popupWin, template)
                })
            }
            $scope.removeOrder = function ($event) {
                if (!confirm("Bạn chắc chứ?"))
                    return false
                var order_id = this.order.id
                $orders.removeOrderFromShipment(order_id, function (result) {
                    if (result == 'success')
                        $scope.init()
                })
            }
            $scope.saveOrderForDivideProduct = function(){
                const arrNotValid = [];
                $.each($scope.productList.detail, function(i, value){
                    if(value.total_quantity > value.inventory){
                        arrNotValid.push(value.product_name)
                    }
                });
                if(arrNotValid.length > 0){
                    const messError = `Các mặt hàng sau không đủ hàng tồn kho: ${arrNotValid.join(', ')}. Vui lòng kiểm tra lại.`;
                    showMessage('error', messError);
                    return 0;
                }
                var postData = $scope.preparePostData();
                $http.post(config.base + '/order/saveDevided', postData)
                    .success(function (data, status) {
                        showAlert.showSuccess(3000, 'Lưu thành công');
                    });

            }
            $scope.divideProduct = function (shouldReload) {
                $scope.saveOrder();
                $http.post(config.base + '/order/updateWarehouse?ship_id=' + $stateParams.shipment_id, $scope.shipment)
                    .success(function (data, status) {
                        showAlert.showSuccess(3000, 'Lưu thành công');
                        if (shouldReload) {
                            setTimeout(function () {
                                    window.location.reload();
                                }, 1000);
                        } else {
                            $location.path('order-management');
                        }
                    })
            };

            $scope.productQuantityChange = function (orderIndex, proIndex) {
                var productId = $scope.orderList[orderIndex].order_detail[proIndex].product_id;
                var newQuan = $scope.orderList[orderIndex].order_detail[proIndex].quantity;
                var preQuan = $scope.orderList[orderIndex].order_detail[proIndex].preQuantity;
                $.each($scope.productList.detail, function(index, product) {
                    if(product.product_id == productId) {
                        $scope.productList.detail[index].total_quantity = parseInt(newQuan) - parseInt(preQuan) + parseInt($scope.productList.detail[index].total_quantity);
                    }
                });
                $scope.orderList[orderIndex].order_detail[proIndex].preQuantity = newQuan;
                callCustomerTotalProduct();
            }

            $scope.getIndexOfProduct = function (order, proId) {
                var result = undefined;
                $.each(order.order_detail, function (index, value) {
                    if (value.product_id == proId) {
                        result = index;
                        return false;
                    }
                });
                return result;
            }
            $scope.removeShipment = function () {
                $http.post(config.base + '/order/xoaShipment', $scope.checkList).success(function (response, status) {
                    var temp = $.grep($scope.orderList, function (a) {
                        return $scope.checkList[a.id];
                    }, true);
                    $scope.orderList = temp;
                    $scope.checkList = [];
                })
            }
            $scope.changeShipment = function () {
                $http.post(config.base + '/order/doiShipment', {
                    id: $scope.checkList,
                    shipment_id: $scope.selectedShipment
                }).success(function (response, status) {
                    var temp = $.grep($scope.orderList, function (a) {
                        return $scope.checkList[a.id];
                    }, true);
                    $scope.orderList = temp;
                    $scope.checkList = [];
                })
            }
            $scope.saveOrder = function () {
                var postData = $scope.preparePostData();
                $http.post(config.base + '/order/saveDevided', postData)
                    .success(function (data, status) {
                        showAlert.showSuccess(3000, 'Lưu thành công');
                        // setTimeout(function () {
                        //     window.location.reload();
                        // }, 1000);
                    });
            }

            $scope.preparePostData = function () {
                var result = [];
                $.each($scope.orderList, function (i, value) {
                    $.each(value.order_detail, function (j, detail) {
                        result.push({id: detail.id, quantity: detail.quantity});
                    })
                });
                return result;
            }

            function callCustomerTotalProduct() {
                if ($scope.orderList) {
                    $.each($scope.orderList, function (index, value) {
                        var sum = 0;
                        $.each(value.order_detail, function (i, detail) {
                            sum += parseInt(detail.quantity);
                        });
                        var oldQuan = $scope.orderList[index].totalQuantity;
                        $scope.orderList[index].totalQuantity = sum;
                        if (oldQuan) {
                            $scope.productList.summary.total_quantity += (sum - oldQuan);
                        }
                    })
                }
                countStandardBox();
            }

            var getParams = function (key) {
                var params = {};
                var query = window.location.href.split("?");
                if (query.length == 1 ) return '';

                var vars = query[1].split('&');
                for (var i = 0; i < vars.length; i++) {
                    var pair = vars[i].split('=');
                    params[pair[0]] = decodeURIComponent(pair[1]);
                }
                if ( key ) return params[key];
                return params;
            };

            function countStandardBox(){
                var count = 0;
                $.each($scope.productList.detail, function(index, product) {
                    if (product.product_name.toLowerCase().indexOf('ly') != -1) {
                        count += 2 * product.total_quantity;
                    } else {
                        count += product.total_quantity;
                    }
                });
                $scope.totalStandardBox = count;
            }
        }
    ])
    .controller('updateQuantityOrderController', function ($scope, $http, $modalInstance, items) {
        $scope.init = function () {
            $http.get(config.base + '/order/getProductOrder/' + items.shipment_id + '/' + items.product_id)
                .success(function (data) {
                    $scope.product_name = items.product_name
                    $scope.orders = data.orders
                })
        }
        $scope.init();

        $scope.ok = function () {
            var order_quantity = new Array();
            $('.quantity-order').each(function () {
                order_quantity.push({
                    quantity: this.value,
                    order_id: $(this).data('order-detail-id')
                })
            })

            $http({
                method: 'POST',
                url: config.base + '/order/updateQuantityOrder',
                data: order_quantity,
                responseType: 'json'
            }).success(function (data, status) {
                //                            if(data.status == 'success')
                //                                $modalInstance.close();
            }).error(function (data, status) {
                console.log(data);
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('statusOrderController', ['$scope', '$http', '$location', 'renderSelect', 'showAlert', '$timeout', 'productService', 'OrderPopover', function ($scope, $http, $location, renderSelect, showAlert, $timeout, productService,OrderPopover) {
        $scope.init = function () {
            $scope.hasError = {};
            $scope.printData = [];
            $scope.printed = [];
            $scope.isProcessing = false;
            $scope.daxuatphat = [];
            var d = new Date();
            $scope.currentDate = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
            $http({
                method: 'GET',
                url: config.base + '/order/statusOrder',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.shipments = data.shipments;
                for(var i = 0;i<$scope.shipments.length; i++){
                    for(var j = 0; j < $scope.shipments[i].orders.length; j++) {
                        var order = $scope.shipments[i].orders[j];
                        order.pay = 1*order.total_price + 1*order.old_debit - order.totalPromotionValue * 1;
                        order.orginal_total_price = order.total_price;
                    }

                    $scope.shipments[i].paymentDetail = [
                        {"tien": 500000, "soluong": 0},
                        {"tien": 200000, "soluong": 0},
                        {"tien": 100000, "soluong": 0},
                        {"tien": 50000, "soluong": 0},
                        {"tien": 20000, "soluong": 0},
                        {"tien": 10000, "soluong": 0},
                        {"tien": 5000, "soluong": 0},
                        {"tien": 2000, "soluong": 0},
                        {"tien": 1000, "soluong": 0},

                    ];

                    if ( $scope.shipments[i].status == 2 ) {
                        for(var j=0; j < $scope.shipments[i].orders.length; j++){
                            $scope.shipments[i].orders[j].status = 3; // Đã giao, default status
                        }
                    }

                }

                setTimeout(function (){
                    for(var i = 0;i<$scope.shipments.length; i++) {
                        for (var j = 0; j < $scope.shipments[i].orders.length; j++) {
                            var order = $scope.shipments[i].orders[j];

                            if (order.old_debit > 0) {
                                $('.add-debit-of-' + order.customer_detail.id).hide();
                                $('#remove-debit-' + i + '-' + j).show();
                            }
                        }
                    }
                });
            }).error(function (data, status) {
                console.log(data);
            });
            $scope.processingModal = $("#processing-modal");
            $scope.processingModal.modal("hide");
        };
        $scope.init();
        $scope.tongTienTheoTo = function( shipmentIndex ) {
            var sum = 0;
            for(var i = 0; i < $scope.shipments[shipmentIndex].paymentDetail.length; i++){
                sum += $scope.shipments[shipmentIndex].paymentDetail[i].tien * $scope.shipments[shipmentIndex].paymentDetail[i].soluong;
            }
            return sum;
        }
        $scope.tongGiaTriChuyen = function( shipmentIndex ) {
            var sum = 0;
            for(var i = 0; i < $scope.shipments[shipmentIndex].orders.length; i++){
                sum += parseInt($scope.shipments[shipmentIndex].orders[i].total_price);
                if ($scope.shipments[shipmentIndex].orders[i].old_debit > 0) {
                    sum += parseInt( $scope.shipments[shipmentIndex].orders[i].old_debit );
                }
                if ($scope.shipments[shipmentIndex].orders[i].totalPromotionValue > 0) {
                    sum -= parseInt( $scope.shipments[shipmentIndex].orders[i].totalPromotionValue );
                }
            }
            return sum;
        }

        $scope.changeStatus = function (event, key) {
            var shipment_id = $(event.currentTarget).data('shipment-id'),
                status = $(event.currentTarget).data('status');
            if ( status == 0 && !$scope.printed.includes(shipment_id)) {
                showAlert.showError(3000, "Chưa in hóa đơn!");
                return false;
            }
            //change button and css
            switch (status) {
                case 0:
                    if ( !$scope.shipments[key].daxuatphat) {
                        $scope.shipments[key].daxuatphat = true;
                        $scope.processingModal.modal("show");
                        $scope.updateStatusShipment(shipment_id, 1, key);
                    }
                    break;
                case 1:
                    if ( !$scope.shipments[key].dakethuc ) {
                        $scope.shipments[key].dakethuc = true;
                        $scope.updateStatusShipment(shipment_id, 2, key);

                        for (var i = 0; i < $scope.shipments[key].orders.length; i++) {
                            $scope.shipments[key].orders[i].status = 3; // Đã giao, default status
                        }
                    }
                    break;
                case 2:
                    if ( !$scope.shipments[key].dagiao ) {
                        $scope.shipments[key].dagiao = true;
                    }
                    break;
                default:
                    break;
            }
        };
        $scope.formatNumber = function () {
            var value = $(event.currentTarget).val().replace(/,/ig, '');
            $(event.currentTarget).val(numeral(value).format('0,0'));
        };
        $scope.updateStatusShipment = function (shipment_id, status, key) {
            if ( status == 1 ) {
                if($scope.daxuatphat.includes( shipment_id )) {
                    $scope.processingModal.modal("hide");
                    return false;
                }
                else $scope.daxuatphat.push(shipment_id);
            }

            var data = [];
            $http({
                method: 'POST',
                url: config.base + '/order/updateStatusShipment?shipment_id=' + shipment_id + '&status=' + status,
                data: data,
                responseType: 'json'
            }).success(function (data, reponseStatus) {
                if (status == 1 && data.result != 1) {
                    $scope.hasError['e' + shipment_id] = data.error;
                    $scope.shipments[key].daxuatphat = false;
                    var index = $scope.daxuatphat.indexOf(shipment_id);
                    if (index > -1) {
                        $scope.daxuatphat.splice(index, 1);
                    }
                    $scope.processingModal.modal("hide");
                } else {
                    $scope.init();
                }
            }).error(function (data, status) {
                console.log(data);
                $scope.processingModal.modal("hide");
            });
        };
        $scope.handlingOrder = function ($event) {
            if($scope.isProcessing) return false;
            
            $scope.isProcessing = true;
            var shipment_id = $($event.currentTarget).data('shipment-id'),
                shipmentIndex = $($event.currentTarget).data('shipmentindex');
            var shipment = $scope.shipments[shipmentIndex];
            var lech = $scope.tongTienTheoTo( shipmentIndex ) - $scope.tongGiaTriChuyen( shipmentIndex );

            var message = 'Chuyến xe: ' + shipment.truck_detail.name + '<br/>';
            if (lech !== 0) {
                message += '<strong>Lệch: ' + numeral(lech).format('0,0') + '</strong><br />';
            }
            message += "Xử lý chuyến xe?";
            bootbox.confirm( message, function( result ) {
                if( result ) {
                    $scope.processingModal.modal("show");
                    var allData = {
                        orderDelivered: [],
                        returnWarehouse: [],
                        processReturnHalfWarehouse: [],
                        shipmentDetail: {},
                    };
                    for( var i=0; i < shipment.orders.length; i++ ) {
                        var currentOrder = shipment.orders[i];
                        switch ( parseInt(shipment.orders[i].status)) {
                            case 3:
                                // $http({
                                //     method: 'POST',
                                //     url: config.base + '/order/orderDelivered',
                                //     async: false,
                                //     data: {
                                //         order_id: shipment.orders[i].id,
                                //         price: shipment.orders[i].pay,
                                //         shipment_id: shipment_id
                                //     },
                                //     responseType: 'json'
                                // }).success(function (data, status) {
                                //     showAlert.showSuccess(3000, 'Lưu thành công - ' + currentOrder.customer_detail.address);
                                // }).error(function (data, status) {
                                //     console.log(data);
                                // });
                                var orderData = {
                                    order_id: shipment.orders[i].id,
                                    price: shipment.orders[i].pay,
                                    shipment_id: shipment_id
                                };
                                allData.orderDelivered.push(orderData);
                                break;
                            case 4:
                                // $http({
                                //     method: 'POST',
                                //     url: config.base + '/order/returnWarehouse?order_id=' + shipment.orders[i].id,
                                //     data: {order_id: shipment.orders[i].id, note: shipment.orders[i].note},
                                //     async: false,
                                //     responseType: 'json'
                                // }).success(function (data, status) {
                                //     if (data.error) {
                                //         $scope.hasError['e' + shipment_id] = data.error;
                                //     } else {
                                //         showAlert.showSuccess(3000, 'Lưu thành công - ' + currentOrder.customer_detail.address);
                                //
                                //     }
                                // }).error(function (data, status) {
                                //     $scope.hasError['e' + shipment_id] = 'Không xử lý được đơn hàng! Vui lòng thử lại hoặc liên hệ kỹ thuật viên';
                                //     console.log(data);
                                // });

                                var orderData = {order_id: shipment.orders[i].id, note: shipment.orders[i].note};
                                allData.returnWarehouse.push(orderData);
                                break;
                            case 6:
                                var data = {
                                    product: shipment.orders[i].orderDetail,
                                    debit: $scope.no(shipment.orders[i]),
                                    price: shipment.orders[i].pay,
                                    shipment_id: shipment_id,
                                    reason: shipment.orders[i].note,
                                    promotionMoney: shipment.orders[i].totalPromotionValue,
                                    promotionProducts: shipment.orders[i].promotionProducts,
                                    order_id: shipment.orders[i].id
                                };

                                allData.processReturnHalfWarehouse.push(data);

                                // $http({
                                //     method: 'POST',
                                //     url: config.base + '/order/processReturnHalfWarehouse?order_id=' + shipment.orders[i].id,
                                //     data: data,
                                //     async: false,
                                //     responseType: 'json'
                                // }).success(function (data, status) {
                                //     showAlert.showSuccess(3000, 'Lưu thành công - ' + currentOrder.customer_detail.address);
                                // }).error(function (data, status) {
                                //     console.log(data);
                                // });

                                break;
                        }
                    }

                    // Save shipment detail
                    allData.shipmentDetail = {
                        shipment_id: shipment_id,
                        payment_detail: shipment.paymentDetail,
                        note: shipment.note
                    };
                    // $http({
                    //     method: 'POST',
                    //     url: config.base + '/shipment/saveShipmentPaymentDetail',
                    //     async: false,
                    //     data: {
                    //         shipment_id: shipment_id,
                    //         payment_detail: shipment.paymentDetail,
                    //         note: shipment.note
                    //     },
                    //     responseType: 'json'
                    // }).success(function (data, status) {
                    //     showAlert.showSuccess(3000, 'Lưu Chi tiết thanh toán thành công');
                    // }).error(function (data, status) {
                    //     console.log(data);
                    // });

                    $http({
                        method: 'POST',
                        url: config.base + '/order/processAllShipmentData',
                        async: false,
                        data: allData,
                        responseType: 'json'
                    }).success(function (data, status) {
                        showAlert.showSuccess(0, 'Xử lý thành công');
                        $scope.init();
                    }).error(function (data, status) {
                        showAlert.showError(0, "Xử lý có lỗi, vui lòng thử lại");
                        console.log(data);
                        $scope.isProcessing = false;
                        $scope.processingModal.modal("hide");
                    });
                } else {
                    $scope.isProcessing = false;
                    $scope.processingModal.modal("hide");
                }
            });

        };

        $scope.changeShipmentOrderResult = function( shipmentIndex, orderIndex ) {
            var status = $scope.shipments[shipmentIndex].orders[orderIndex].status;
            $scope.inprogressOrder = null;
            if ($scope.shipments[shipmentIndex].orders[orderIndex].orderDetail)
                $scope.shipments[shipmentIndex].orders[orderIndex].orderDetail = null;

            if ($scope.shipments[shipmentIndex].orders[orderIndex].totalPromotionValue)
                $scope.shipments[shipmentIndex].orders[orderIndex].totalPromotionValue = null;

            if ($scope.shipments[shipmentIndex].orders[orderIndex].totalDebit)
                $scope.shipments[shipmentIndex].orders[orderIndex].totalDebit = null;

            if ($scope.shipments[shipmentIndex].orders[orderIndex].applyPromotion)
                $scope.shipments[shipmentIndex].orders[orderIndex].applyPromotion = null;

            if ($scope.shipments[shipmentIndex].orders[orderIndex].totalDebit)
                $scope.shipments[shipmentIndex].orders[orderIndex].totalDebit = 0;

            $scope.shipments[shipmentIndex].orders[orderIndex].note = '';

            if( status == 3 ) {
                $scope.shipments[shipmentIndex].orders[orderIndex].total_price = $scope.shipments[shipmentIndex].orders[orderIndex].orginal_total_price;
                $scope.shipments[shipmentIndex].orders[orderIndex].pay = 1*$scope.shipments[shipmentIndex].orders[orderIndex].total_price + 1*$scope.shipments[shipmentIndex].orders[orderIndex].old_debit;

            }

            if ( status == 4 ) {
                $('#returning-reason').data('orderindex', orderIndex);
                $('#returning-reason').data('shipmentindex', shipmentIndex);
                $('#reasonmodal').modal('show');
                $scope.shipments[shipmentIndex].orders[orderIndex].pay = 0;
                $scope.shipments[shipmentIndex].orders[orderIndex].total_price = 0;
                // $scope.calPrice();
            }

            if ( status == 6 ) {
                $http({
                    method: 'GET',
                    url: config.base + '/order/returnHalfWarehouse?order_id=' + $scope.shipments[shipmentIndex].orders[orderIndex].id,
                    responseType: 'json'
                }).success(function (data, status) {
                    $scope.shipments[shipmentIndex].orders[orderIndex].orderDetail = data.detail;
                    $scope.shipments[shipmentIndex].orders[orderIndex].totalPromotionValue = parseInt(data.totalPromotionValue);
                    $scope.shipments[shipmentIndex].orders[orderIndex].totalDebit = parseInt(data.currentDebit);
                    $scope.shipments[shipmentIndex].orders[orderIndex].promotionProducts = data.promotionProducts;

                    $scope.inprogressOrder = $scope.shipments[shipmentIndex].orders[orderIndex];


                    $scope.calPrice();
                    setTimeout(function(){
                        $("#return-haft-order").modal("show");
                    });
                }).error(function (data, status) {
                    console.log(data);
                });
            }
        }

        $scope.quantityWarehouse = function (key) {
            var received = parseInt($scope.inprogressOrder.orderDetail[key].received);
            var quantity = parseInt($scope.inprogressOrder.orderDetail[key].quantity);
            var inventory = parseInt($scope.inprogressOrder.orderDetail[key].inventory);
            if (received > (quantity + inventory)) {
                alert('Tồn kho không đủ! Có thể bạn cần trả hàng của một đơn hàng nào đó trước khi xử lý đơn hàng này.');
                $scope.inprogressOrder.orderDetail[key].received = quantity + inventory;
            }

            $scope.calPrice();
        };

        $scope.calPrice = function () {
            $scope.inprogressOrder.tempAmount = productService.sum($scope.inprogressOrder.orderDetail, 'received', 'price');
            $scope.inprogressOrder.total_price = $scope.inprogressOrder.tempAmount;
            $scope.inprogressOrder.total_price = $scope.inprogressOrder.total_price + $scope.inprogressOrder.totalDebit;
            if($scope.inprogressOrder.totalPromotionValue > 0) {
                $scope.inprogressOrder.total_price = $scope.inprogressOrder.total_price - $scope.inprogressOrder.totalPromotionValue;
            }

            var debit = $scope.inprogressOrder.total_price - $scope.inprogressOrder.actual_price;
            if (isNaN(debit) || debit < 0) debit = 0;
            $scope.inprogressOrder.debit = debit;
        };

        // $scope.createBill = function (order_id, price, shipment_id) {
        //     $http({
        //         method: 'POST',
        //         url: config.base + '/order/orderDelivered',
        //         data: {
        //             order_id: order_id,
        //             price: price,
        //             shipment_id: shipment_id
        //         },
        //         responseType: 'json'
        //     }).success(function (data, status) {
        //         $scope.init();
        //     }).error(function (data, status) {
        //         console.log(data);
        //     });
        // };
        $scope.updateOrder = function (order_id) {
            $http({
                method: 'GET',
                url: config.base + '/order/updateOrder?order_id=' + order_id,
                data: {
                    order_id: order_id
                },
                responseType: 'json'
            }).success(function (data, status) {
                console.log(data);
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.huydonhang = function (shipment_id) {
            $http.get(config.base + '/order/xoaChuyen?id=' + shipment_id).then(function (reponse) {
                var index = -1;
                $.each($scope.shipments, function (key, value) {
                    if (value.id == shipment_id) {
                        index = key
                    }
                    ;
                });
                if (index >= 0) {
                    $scope.shipments.splice(index, 1);
                }
            })
        };
        $scope.returndevide = function (id) {
            $location.path('order-divide/' + id + "?disabled=1");
        };
        $scope.inhoadon = function (shipment_id) {
            //console.log('213')
            $("body").css("cursor", "progress");
            $http({
                method: 'GET',
                url: config.base + '/order/getOrderByShipment?i=' + shipment_id + '&d=1',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.printData = [];
                for(var i = 0; i < data.length; i++){
                    var phone_string = JSON.parse(data[i].customer_phone);
                    data[i].list_phone_customer = phone_string.join(',');
                }
                $scope.printData = data;
                var currentshipment = null;
                for(var i=0; i<$scope.shipments.length;i++){
                    if ($scope.shipments[i].id == shipment_id){
                        currentshipment = $scope.shipments[i];
                        break;
                    }
                }
                if (currentshipment) {
                    for(i=0;i<$scope.printData.length;i++){
                        $scope.printData[i].currentDebit = 0;
                        for(var j = 0; j < currentshipment.orders.length; j++) {
                            if (currentshipment.orders[j].id==$scope.printData[i].id){
                                $scope.printData[i].currentDebit = currentshipment.orders[j].old_debit;
                                break;
                            }
                        }
                    }
                }
                //console.log($scope.printData)
                setTimeout(function () {
                    processPrinting();
                    $("body").css("cursor", "default");
                    $scope.printed.push(shipment_id * 1);
                });
            }).error(function (a, b, c) {
                console.log(a, b, c);
                $("body").css("cursor", "default");
            });
        };
        $scope.totalQuantity = function (order_detail) {
            var result = 0;
            $.each(order_detail, function (key, value) {
                result += parseInt(value.quantity);
            });
            return result;
        };
        $scope.returnWarehouseReason = function () {
            var orderIndex = $('#returning-reason').data('orderindex');
            var shipmentIndex = $('#returning-reason').data('shipmentindex');
            var note = $("#returning-reason").val();
            if( !note || note.length == 0){
                alert('Chưa nhập lý do trả hàng.');
                return false;
            }

            $scope.shipments[shipmentIndex].orders[orderIndex].note = note;
            $('#returning-reason').data('orderindex', '');
            $('#returning-reason').data('shipmentindex', '');
            $('#returning-reason').val( '');
            $('#reasonmodal').modal('hide');

        };
        $scope.addDebit = function (shipmenindex, orderindex, customerid) {
            $scope.shipments[shipmenindex].orders[orderindex].old_debit = $scope.shipments[shipmenindex].orders[orderindex].currentDebit;

            $http({
                method: 'POST',
                url: config.base + '/order/addOldDebitToOrder',
                data: {
                    id: $scope.shipments[shipmenindex].orders[orderindex].id,
                    debit: $scope.shipments[shipmenindex].orders[orderindex].old_debit
                },
                responseType: 'json'
            });

            $('.add-debit-of-' + customerid).hide();
            $('#remove-debit-' + shipmenindex + '-' + orderindex).show();
        }
        $scope.removeDebit = function (shipmenindex, orderindex, customerid) {
            $scope.shipments[shipmenindex].orders[orderindex].old_debit = 0;
            $http({
                method: 'POST',
                url: config.base + '/order/removeOldDebitFromOrder',
                data: {
                    id: $scope.shipments[shipmenindex].orders[orderindex].id
                },
                responseType: 'json'
            });

            $('.add-debit-of-' + customerid).show();
            $('#remove-debit-' + shipmenindex + '-' + orderindex).hide();
        }

        $scope.tongthanhtien = function(shipment){
            var result = 0;
            for(var i=0; i < shipment.orders.length; i++) {
                result += shipment.orders[i].total_price*1 - shipment.orders[i].totalPromotionValue*1 + shipment.orders[i].old_debit*1
            }
            return result;
        }

        $scope.no =function(order) {
            var pay = 0;
            if (order.pay) {
                pay = parseInt(order.pay);
            }
            return order.total_price*1 - order.totalPromotionValue*1 + order.old_debit*1 - pay;
        }

        $scope.updateDefaultPayment = function () {
            if( !$scope.inprogressOrder.note || $scope.inprogressOrder.note.length == 0){
                alert('Chưa nhập ghi chú.');
                return false;
            }

            $scope.inprogressOrder.pay = $scope.inprogressOrder.total_price * 1 - $scope.inprogressOrder.totalPromotionValue * 1 + $scope.inprogressOrder.old_debit * 1;
            $("#return-haft-order").modal("hide");
        }

        $scope.tongthanhtoan = function(shipment) {
            var result = 0;
            for(var i=0; i < shipment.orders.length; i++) {
                if (shipment.orders[i].pay) {
                    result += parseInt(shipment.orders[i].pay);
                }
            }
            return result;
        }
        $scope.tongno = function(shipment) {
            var result = 0;
            for(var i=0; i < shipment.orders.length; i++) {
                result += shipment.orders[i].total_price*1 - shipment.orders[i].totalPromotionValue*1 + shipment.orders[i].old_debit*1 - parseInt(shipment.orders[i].pay);
            }
            return result;
        }
        $scope.deletePromotion = function(promotion){
            for( var i = 0; i < $scope.inprogressOrder.promotionProducts.length; i++) {
                if ($scope.inprogressOrder.promotionProducts[i].product_id == promotion.product_id ){
                    $scope.inprogressOrder.promotionProducts.splice(i, 1);
                    break;
                }
            }
        }
        $scope.deletePromotionMoney = function (){
            $scope.inprogressOrder.totalPromotionValue = null;
        }

        function processPrinting() {
            console.log('1111')
            $("#print-area").show();
            console.log('element: ', document.getElementById("print-area"));
            productService.printElement(document.getElementById("print-area"));
            window.print();
            $("#print-area").hide();
        }

        $scope.showPopover = function(dom){
            OrderPopover.init(dom, false);
        }
    }])
    .controller('listOrderController', ['$scope', '$http', '$location', 'OrderPopover', function ($scope, $http, $location,OrderPopover) {
        $scope.init = function () {
            $http({
                method: 'POST',
                url: config.base + '/order',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.orders = data.orders;
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.filter_order = '';
        $scope.init();
        $scope.deleteOrder = function (index) {
            if (!confirm('Bạn chắc chứ?'))
                return false;

            $http.get(config.base + '/order/deleteOrder/' + this.item.id).success(function () {
                showMessage('success', 'Đã xóa hóa đơn.');
                $scope.orders.splice(index, 1);
            })
        }
        $scope.showPopover = function(dom){
            OrderPopover.init(dom);
        }
    }])
    .controller('detailOrderController', ['$scope', '$http', '$location', '$stateParams', '$modal', '$filter', function ($scope, $http, $location, $stateParams, $modal, $filter) {

        $scope.init = function () {
            $http({
                method: 'POST',
                url: config.base + '/order/getOrder?id=' + $stateParams.order_id,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.order = data.order;
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.init();
        $scope.deleteProduct = function () {
            if (confirm('Chắc chứ?'))
                $scope.order.order_detail.splice(this.$index, 1);
        }
        $scope.printOrder = function () {
            var phone = '',
                name = '',
                debt = 0,
                phone_home = JSON.parse($scope.order.customer_detail.phone_home),
                phone_mobile = JSON.parse($scope.order.customer_detail.phone_mobile)
            if (phone_home.length > 0) {
                phone += phone_home[0] + ' '
            }
            if (phone_mobile.lengh > 0)
                phone += phone_mobile[0]
            if ($scope.order.customer_detail.name)
                name = $scope.order.customer_detail.name;
            if ($scope.order.customer_detail.debit.debt)
                debt = $scope.order.customer_detail.debit.debt;
            var html = '';
            var i = 1;
            var table = $filter('filter')($scope.order.order_detail, function (item) {

                html += '<tr><td>' + i + '</td>';
                html += '<td>' + item.product_detail.name + '</td>';
                html += '<td>' + item.quantity + '</td>';
                html += '<td>' + numeral(item.total).format('0,0') + '</td>';
                html += '</tr>'
                i++
            })

            var popupWin = window.open('', '_blank', 'width=80');
            popupWin.document.open()
            popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="style.css" />' +
                '<style>table tfoot{text-align: right;} table, th, td {border: 1px solid black; font-size: 11px} table{width: 100%;border-collapse: collapse;}</style>' +
                '</head>' +
                '<body onload="window.print(); window.close()">' +
                '<div style="text-align: center"><h1>TUẤN MAI</h1></div>' +
                '<div>Tên KH: ' + name + '</div>' +
                '<div>Địa chỉ: ' + $scope.order.customer_detail.address + '</div>' +
                '<div>Điện thoại: ' + phone + '</div>' +
                '<div>Mã HĐ: ' + $scope.order.order_code.replace(/"/ig, '') + '</div><br>' +
                '<div><table><thead><tr style="text-align: center"><td>&nbsp</td><td>Tên SP</td><td>SL</td><td>VNĐ</td></tr></thead>' +
                '<tbody>' + html + '</tbody>' +
                '<tfoot><tr><td colspan="2">Thành tiền: <br>Tổng nợ: <br> Tổng cộng' +
                '<td colspan="2">' +
                numeral($scope.order.total_price).format('0,0') + '<br>' +
                numeral(debt).format('0,0') + '<br>' +
                numeral((parseInt(debt) + parseInt($scope.order.total_price))).format('0,0') +
                '</td></tr></tfoot></table></div>' +
                '</body></html>');
            popupWin.document.close();
        }
        $scope.calulationPrice = function ($event) {
            var quantity = $($event.currentTarget).val(),
                price = parseInt($('#price_product_' + this.$index).text().replace(/,/ig, ''));
            if (quantity == '')
                quantity = 0;

            var total = price * parseInt(quantity);
            $('#total_product_' + this.$index).text(numeral(total).format('0,0'))
        }
        $scope.updateOrder = function () {
            $('.new_quantity').each(function () {
                var key = $(this).data('key')
                $scope.order.order_detail[key].quantity = this.value;
                $scope.order.order_detail[key].total = $('#total_product_' + key).text().replace(/,/ig, '')
            })
            $http({
                method: 'POST',
                url: config.base + '/order/updateOrderDetail?order_id=' + $stateParams.order_id,
                data: {
                    order_detail: $scope.order.order_detail,
                    note: $scope.order.note
                },
                responseType: 'json'
            }).success(function (data, status) {
                $location.path('order-list');
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.openPopup = function (size, $event) {
            var modalInstance = $modal.open({
                templateUrl: 'add_product',
                controller: 'addProductController',
                size: 'lg'
            });
            modalInstance.result.then(function (data) {
                $scope.order.order_detail.push(data)
            });
        };
    }])
    .controller('returnOrderHalfController', ['$scope', '$http', '$stateParams', 'showAlert', '$location', 'productService', function ($scope, $http, $stateParams, showAlert, $location, productService) {
            $scope.order = [];
            $scope.total_price = 0;
            $scope.actual_price = '0';
            $scope.totalDebit = 0;
            $scope.totalPromotionValue = 0;
            $scope.tempAmount = 0;
            $scope.debit = 0;
            $scope.reason = '';
            $scope.applyPromotion = false;

            $scope.init = function () {
                $http({
                    method: 'GET',
                    url: config.base + '/order/returnHalfWarehouse?order_id=' + $stateParams.order_id,
                    responseType: 'json'
                }).success(function (data, status) {
                    $scope.order = data.detail;
                    $scope.totalPromotionValue = parseInt(data.totalPromotionValue);
                    $scope.totalDebit = parseInt(data.currentDebit);
                }).error(function (data, status) {
                    console.log(data);
                });
            };
            $scope.init();
            $scope.getTotal = function () {
                var price = 0;
                $('.new_price').each(function () {
                    price += parseInt($(this).text().replace(/,/ig, ''));
                });
                $scope.tempAmount = price;
                $scope.total_price = $scope.tempAmount - $scope.totalPromotionValue + $scope.totalDebit;//numeral(price).format('0,0');
            };
            $scope.quantityWarehouse = function (key) {
                var received = parseInt($scope.order[key].received);
                var quantity = parseInt($scope.order[key].quantity);
                var inventory = parseInt($scope.order[key].inventory);
                if (received > (quantity + inventory)) {
                    alert('Tồn kho không đủ! Có thể bạn cần trả hàng của một đơn hàng nào đó trước khi xử lý đơn hàng này.');
                    $scope.order[key].received = quantity + inventory;
                }
                $scope.calPrice();
            };
            $scope.calPrice = function () {
                $scope.tempAmount = productService.sum($scope.order, 'received', 'price');
                $scope.total_price = $scope.tempAmount + $scope.totalDebit;
                if($scope.applyPromotion) {
                    $scope.total_price = $scope.total_price - $scope.totalPromotionValue;
                }

                var value = parseInt($scope.actual_price.replace(/,/ig, ''));
                if (!value) {
                    value = 0;
                }
                var debit = numeral($scope.total_price - value);
                if (debit < 0) debit = 0;
                $scope.debit = numeral(debit).format('0,0');
                $scope.actual_price = numeral(value).format('0,0')
            };
            $scope.divideWarehouse = function () {
                if(!$scope.reason.trim()) {
                    alert('Chưa nhập lý do trả hàng.');
                    return false;
                }
                var data = {
                    product: $scope.order,
                    debit: $scope.debit.toString().replace(/,/ig, ''),
                    price: $scope.actual_price.toString().replace(/,/ig, ''),
                    shipment_id: $stateParams.shipment_id,
                    reason:$scope.reason.trim(),
                    using_promotion: $scope.applyPromotion
                };

                $http({
                    method: 'POST',
                    url: config.base + '/order/processReturnHalfWarehouse?order_id=' + $stateParams.order_id,
                    data: data,
                    responseType: 'json'
                }).success(function (data, status) {
                    showAlert.showSuccess(3000, 'Lưu thành công');
                    $location.path('order-status');
                }).error(function (data, status) {
                    console.log(data);
                });
            };
        }])
    .controller('Retail', ['$scope', '$http', 'productService', 'showAlert', function($scope, $http, productService, showAlert) {
        $scope.totalValue = 0;
        $scope.listProduct = [];
        $scope.selectedProds = {};
        $scope.searchCustomer = '';
        $scope.show_customer = '';
        var d = new Date();
        $scope.currentDate = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();

        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/warehouse_retail',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.data_customer = data.customers;
                $scope.listProduct = data.products;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();

        $scope.selectProd = function(product){
            if ( jQuery('#check-' + product.id).is(':checked')) {
                $scope.selectedProds[product.id] = product;
                $scope.selectedProds[product.id]['removeQuantity'] = product.quantity;
            } else {
                delete $scope.selectedProds[product.id];
            }
        };

        $scope.selectCustomer = function (type) {
            $scope.searchCustomer = '';
            $scope.partner = this.item.id;
            $scope.show_customer = this.item;
            $scope.customer_print = this.item
        };
        $scope.calTotalValue = function(){
            let totalVal = 0;
            Object.keys($scope.selectedProds).forEach(key => {
                totalVal += parseInt($scope.selectedProds[key].price);
            });

            $scope.totalValue = totalVal;
        }
        $scope.createBill = function (el) {

            var buy_price = new Array();
            Object.keys($scope.selectedProds).forEach(key => {
                buy_price.push({
                    product_id: $scope.selectedProds[key].id,
                    quantity: $scope.selectedProds[key].removeQuantity,
                    unit: $scope.selectedProds[key].primary_unit,
                    price: $scope.selectedProds[key].price
                })
            });

            let data = {
                partner: null,
                buy_price: buy_price,
                total_bill: $scope.totalValue,
                reason: 'Thanh lý hàng lẻ',
                debt: 0
            };

            //======= send request =======
            $(el.currentTarget).attr('value', 'loading...')
            $http.post(config.base + '/warehouse_retail/createBill', data)
                .success(function (data, status) {
                    $(el.currentTarget).attr('value', 'Tạo hoá đơn')
                    showAlert.showSuccess(3000, 'Lưu thành công');
                    setTimeout(function(){
                        window.location.reload( true );
                    }, 500);
                })
                .error(function (data, status) {
                    console.log(data);
                });

        };
}]);