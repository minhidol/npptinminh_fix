'use strict';

/* Controllers */

angular.module('dashboard.controllers', ['ui.bootstrap'])
    .controller('dashboardController', ['$scope', function ($scope) {
        console.log('load ok');
    }])
    .controller('productTypeController', ['$scope', '$http', 'showAlert', function ($scope, $http, showAlert) {
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/product_type',
                responseType: 'json'
            }).success(function (data, status) {
                //==== get data account profile ========
                $scope.products = data;

            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.printMe = function () {
            var popupWin = window.open('', '_blank', 'width=100');
            popupWin.document.open()
            popupWin.document.write('<html><head><link rel="stylesheet" type="text/css" href="style.css" /></head><body onload="window.print(); window.close()"><div style="font-size:14px">' + '40000 thôi chứ nhiêu, nhưng mày hên vì có thằng bạn đẹp trai như tao =))' + '</div></html>');
            popupWin.document.close();
        }
        $scope.editProduct = function (el) {
            $scope.changeView('edit', 'cancel', el.item.id);
        };
        $scope.deleteProductType = function () {
            if (!confirm('Bạn chắc chứ?'))
                return false;
            $http({
                method: 'GET',
                url: config.base + '/product_type/deleteType?id=' + this.item.id,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.init();
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.updateProduct = function (el) {
            $http({
                method: 'POST',
                url: config.base + '/product_type/updateProductType',
                data: {
                    id: el.item.id,
                    name: $('#cancel_name_' + el.item.id).val()
                },
                responseType: 'json'
            }).success(function (data, status) {
                //==== get data account profile ========
                $scope.init();
                //                    $('#tabel_product_type').dataTable();
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.cancelProduct = function (el) {
            $scope.changeView('cancel', 'edit', el.item.id);
        };
        $scope.changeView = function (show, hide, id) {
            $('#' + show + '_name_' + id).hide();
            $('#' + hide + '_name_' + id).show();
            $('#' + show + '_btn_' + id).hide();
            $('#' + hide + '_btn_' + id).show();
        };
        $scope.createType = true;
        $scope.showCreateType = function () {
            $scope.createType = false;
        };
        $scope.cancelCreate = function () {
            $scope.createType = true;
            $scope.product_type_name = '';
            $scope.product_description = '';
        };

        $scope.saveProductType = function () {
            $http({
                method: 'post',
                url: config.base + '/product_type/createProductType',
                data: {
                    name: $scope.product_type_name,
                    description: $scope.product_description
                },
                responseType: 'json'
            }).success(function (data, status) {
                $scope.cancelCreate();
                showAlert.showSuccess(3000, 'lưu thành công');
                $scope.init();

            }).error(function (data, status) {
                console.log(data);
            });
        };
    }])
    .controller('createProductController', ['$timeout', '$scope', '$http', 'showAlert', '$stateParams', '$location', 'productService', function ($timeout, $scope, $http, showAlert, $stateParams, $location, productService) {
        if ($stateParams.id) {
            $scope.url = config.base + '/products/createProductView?id=' + $stateParams.id;
            $scope.urlSave = config.base + '/products/editProduct?id=' + $stateParams.id;
        } else {
            $scope.url = config.base + '/products/createProductView';
            $scope.urlSave = config.base + '/products/createProduct';
        }
        $scope.product = {};
        $scope.product_length;
        $scope.lstUnit = [];
        $scope.init = function () {
            $scope.product.sale_price = [{
                id: '',
                name: '',
                quantity: '',
                price: '',
                parent_name: '',
                parent_id: '',
                unit: ''
            }];
            $scope.activeSaveProduct = false;
            var objGetProductType = productService.getProductTypes();
            objGetProductType.then(function (data) {
                $scope.lstProductType = data.product_type;
                $scope.allProduct = data.all_product;
            });

            if ($stateParams.id) {
                $http.get(config.base + '/products/get?i=' + $stateParams.id).then(function (response) {
                    $scope.product = response.data.products;
                    if ($scope.product.sale_price.length <= 0) {
                        $scope.product.sale_price = [{
                            id: '',
                            name: '',
                            quantity: '',
                            price: '',
                            parent_name: '',
                            parent_id: '',
                            unit: ''
                        }];
                    }
                    $scope.product_type = angular.copy($scope.product.product_type.id);
                })
            }
            loadUnit();
            $scope.$on('dataloaded', function () {
                $timeout(function () {
                    $(".selectpicker").selectpicker();
                    if ($scope.product.sale_price != undefined && $scope.product.sale_price.length > 0) {
                        for (var i = 0; i < $scope.product.sale_price.length; i++) {
                            $scope.product.sale_price[i].unit = parseInt($scope.product.sale_price[i].unit);
                        }
                        $(".selectpicker").change();
                    }
                }, 0, false);
            });
        };
        $scope.init();
        $scope.morePrice = function (index) {
            var unit = $("#unit-name-" + index + " option:selected");
            if (unit.val() == '') return false;
            $scope.product.sale_price.push({
                id: '',
                name: '',
                quantity: '',
                price: '',
                parent_name: unit.text(),
                parent_id: unit.val(),
                unit: ''
            })

            setTimeout(function () {
                $('#unit-name-' + $scope.product.sale_price.length).selectpicker();
            }, 1000);
        };
        $scope.deleteProduct = function (key) {
            if (!confirm('Bạn chắc chứ?'))
                return false
            $http.get(config.base + '/products/deleteInvoice/' + this.item.id).success(function (result) {
                if (result)
                    $scope.product.buy_price.splice(key, 1)
            });

        }
        $scope.checkCode = function () {
            $http.get(config.base + '/products/checkCode/' + $scope.product.code).success(function (result) {
                $('.error-result').hide()
                $('.success-result').hide()
                if (result == 0)
                    $('.success-result').show()
                else
                    $('.error-result').show()
            })

        }
        $scope.formatNumber = function () {
            var value = event.currentTarget.value.replace(/,/ig, '').replace(/[^-]+(-)/, '$1');
            if ( value == '-') {
                $(event.currentTarget).val('-');
            }
            else {
                $(event.currentTarget).val(numeral(value).format('0,0'));
            }
        }
        $scope.createProduct = function (el) {
            $scope.activeSaveProduct = true;
            var list_price = new Array();
            for (var i = 0; i < $scope.product.sale_price.length; i++) {
                if ($scope.product.sale_price[i].quantity != null) {
                    var product = angular.copy($scope.product.sale_price[i]);

                    product.name = $("#unit-name-" + (i + 1) + " option:selected").text();
                    list_price.push(product);
                }
            }

            if (list_price.length == 0)
                return false;

            $scope.product.sale_price = list_price;
            var sale_unit = $("#unit-name-1").val();
            var product = {
                name: $scope.product.name,
                code: $scope.product.code,
                description: $scope.product.description,
                sale_unit: sale_unit,
                primary_unit: sale_unit,
                conversion_rate: 1,
                product_type: $scope.product_type,
                list_price: $scope.product.sale_price
            };
            if ($scope.product.alias != '' && $scope.product.alias != null) {
                product['alias'] = angular.copy($scope.product.alias);
            }
            $(el.currentTarget).find('[type=submit]').attr('value', 'loading...');
            //console.log('url: ', $scope.urlSave);
            console.log('product: ', $scope.product);
            $http({
                method: 'post',
                url: $scope.urlSave,
                data: product,
                responseType: 'json'
            }).success(function (data, status) {
                console.log('data3: ', data);
                showAlert.showSuccess(3000, 'Lưu thành công');
                $scope.activeSaveProduct = true;
                $(el.currentTarget).find('[type=submit]').attr('value', 'Save')
                $location.path('product');
            }).error(function (data, status) {
                console.log(data);
            });
        };

        function loadUnit() {
            var objGetProducts = productService.getUnits();
            objGetProducts.then(function (data) {
                $scope.lstUnit = data;
                setTimeout(function () {
                    $scope.$broadcast('dataloaded');
                }, 1000);
            });
        }

        $scope.addUnit = function () {
            $("#warning").text('');
            $("#unitModal").modal('show');
            $("input[name=new-unit]").focus();
        };

        $scope.SaveNewUnit = function () {
            $("#warning").text('');
            if ($("input[name=new-unit]").val().trim() != '') {
                $http.post(config.base + '/ProductUnit/create', {
                    'name': $("input[name=new-unit]").val(),
                    'is_prefix': ($("input[name=unit-prefix]").prop('checked') ? 1 : 0)
                })
                    .then(function () {
                        window.location.reload();
                        $("#close-modal").click();
                        $("input[name=new-unit]").val('');
                    }, function () {
                        $("#warning").text('Lưu không thành công!!! Hãy thử lại.');
                        $("#warning").show();
                        console.log(a, b, c);
                    })

            }
            else {
                $("#warning").text('Chưa nhập quy cách!!!');
                $("#warning").show();
            }
        }
    }])
    .controller('productController', ['$scope', '$http', 'renderSelect', function ($scope, $http, renderSelect) {
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/products',
                responseType: 'json'
            }).success(function (data, status) {
                //==== get data account profile ========
                $scope.products = data.products;
                renderSelect.initDataSelect(data.product_type, '#filter_product_type', 'Ngành hàng', null, null, null, null, true);
                // renderSelect.initSelect();

            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.deleteProduct = function ($event) {
            if (!confirm('b?n ch?c ch??'))
                return false;
            $http({
                method: 'GET',
                url: config.base + '/products/deleteProduct?id=' + $($event.currentTarget).attr('id'),
                responseType: 'json'
            }).success(function (data, status) {
                $scope.init();
            }).error(function (data, status) {
                console.log(data);
            });
        }
    }])
    .controller('warehouseWholesaleController', ['$scope', '$http', '$stateParams', 'showAlert', '$location', 'renderSelect', '$state', '$timeout', 'productService', function ($scope, $http, $stateParams, showAlert, $location, renderSelect, $state, $timeout, productService) {
        if ($stateParams.type === 'wholesale') {
            $scope.url = config.base + '/warehouse_wholesale/saveAddWholesale';
            $scope.warehouse_type = 'Sỉ';
            $scope.warehouse_type_en = 'wholesale';
        } else {
            $scope.url = config.base + '/warehouse_retail/saveAddRetail';
            $scope.warehouse_type = 'Lẻ';
            $scope.warehouse_type_en = 'retail';
        }
        $scope.wholesale = {};
        $scope.wholesale.partner = 1;
        $scope.wholesale.total_bill = 0;
        $scope.show_total_bill = 0;
        $scope.searchCustomer = '';
        $scope.show_customer = new Array();
        $scope.wholesale.actual = 0;
        $scope.lstOrderProduct = [];
        $scope.disabled = false;
        $scope.addMoreProcessing = 0;
        $scope.khohang = '';
        $scope.productwarehouse = [];
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/warehouse_wholesale/addWholesale',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.products = data.products;
                $scope.customers = data.customers;
                $scope.listwarehouse = data.listwarehouse;
                $timeout(function () {
                    $("#select-wharehouse").selectpicker();
                });
            }).error(function (data, status) {
                console.log(data);
            });
            var objGetProducts = productService.getProducts();
            objGetProducts.then(function (data) {
                $scope.danhSachDonVi = data.units;
                $scope.danhSachSanPhamPrim = angular.copy(data.products);
                $scope.danhSachSanPham = productService.prepareProductName(data.products, data.units, false);
                $scope.productwarehouse = data.productwarehouse;
                $scope.lstOrderProduct.push({
                    'id': '',
                    'product': '',
                    'unit': null,
                    'unitname': '',
                    'price': null,
                    'quantity': null
                });

                $timeout(function () {
                    $(".selectpicker").selectpicker();
                })
            });

            $http({
                method: 'GET',
                url: config.base + '/Products/getLastBuyPrice',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.lastPrice = data;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.selectCustomer = function () {
            $scope.searchCustomer = '';
            $scope.show_customer = this.item;
            $scope.wholesale.partner = this.item.id;
        }
        $scope.checkBill = function () {
            if ($('#actual_warehouse').val().replace(/,/g, '') == 0) {
                $scope.wholesale.debt = $scope.totalValue;
                $('#debt_warehouse').val(numeral($scope.wholesale.debt).format('0,0'));
                return false;
            }

            $scope.wholesale.actual = parseInt($('#actual_warehouse').val().replace(/,/g, ''));
            $('#actual_warehouse').val(numeral($('#actual_warehouse').val()).format('0,0'));

            $scope.wholesale.debt = $scope.totalValue - parseInt($scope.wholesale.actual);
            $('#debt_warehouse').val(numeral($scope.wholesale.debt).format('0,0'));
        };
        $scope.addWhole = function () {
            if($scope.disabled) return false;

            $scope.disabled = true;
            var buy_price = new Array();
            var product_id;
            for(var i =0 ; i< $scope.lstOrderProduct.length; i++) {
                if ($scope.lstOrderProduct[i].product) {
                    var that = this;
                    buy_price.push({
                        product_id: $scope.lstOrderProduct[i].product,
                        quantity: $scope.lstOrderProduct[i].quantity,
                        unit: $scope.lstOrderProduct[i].unit,
                        price: $scope.lstOrderProduct[i].price
                    });
                }
                ;
            };

            if (buy_price.length === 0) {
                showMessage('warning', 'Bạn chưa chọn sản phẩm nào!');
                $scope.disabled = false;
                return false;
            }
            if ( !$scope.khohang ) {
                showMessage('warning', 'Bạn chưa chọn kho!');
                $scope.disabled = false;
                return false;
            }
            if( !checkConflitWarehouse() ) {
                $scope.disabled = false;
                return false;
            }
            $scope.wholesale.buy_price = buy_price;
            $scope.wholesale.total_bill = $scope.totalValue;
            $scope.wholesale.warehouseid = $scope.khohang;
            $scope.wholesale.debt = parseInt($('#txt_hide_total_bill').val()) - parseInt($scope.wholesale.actual);

            $http({
                method: 'post',
                url: $scope.url,
                data: $scope.wholesale,
                responseType: 'json'
            }).success(function (data, status) {
                showMessage('success', 'Lưu thành công');
                $location.path('/warehouse/wholesale');
            }).error(function (jqXHR, status, $error) {
                $scope.disabled = false;
                showMessage('error', status + ": " + $error);
            });

        };
        $scope.chonkho = function() {
            $('div.section.last input.loading').prop('disabled', false);
        }
        $scope.productChange = function(index){
            var proid = $scope.lstOrderProduct[index].product;
            for(var i =0; i < $scope.danhSachSanPhamPrim.length; i++) {
                if ($scope.danhSachSanPhamPrim[i].id == proid) {
                    $scope.lstOrderProduct[index].unit = $scope.danhSachSanPhamPrim[i].primary_unit;
                    break;
                }
            }
            for (i = 0; i < $scope.danhSachDonVi.length; i++) {
                if ($scope.danhSachDonVi[i].id == $scope.lstOrderProduct[index].unit) {
                    $scope.lstOrderProduct[index].unitname = $scope.danhSachDonVi[i].name;
                    break;
                }
            }

            $scope.lstOrderProduct[index].price = $scope.getLastPrice( proid );
            $scope.calculatorPrice();

            checkConflitWarehouse();
        }
        $scope.calculatorPrice = function () {
            var total = 0;
            $scope.totalQuantity = 0;
            for (var i = 0; i < $scope.lstOrderProduct.length; i++) {
                var subTotal = $scope.lstOrderProduct[i].price * $scope.lstOrderProduct[i].quantity;
                $scope.totalQuantity += $scope.lstOrderProduct[i].quantity;
                total += subTotal;
            }
            $scope.totalValue = total;

            $scope.checkBill();
        };
        $scope.deleteProduct = function (index) {
            $scope.lstOrderProduct.splice(index, 1);
            $scope.calculatorPrice();
        };
        $scope.moreOrder = function () {
            if ( $scope.addMoreProcessing == 1) return false;
            $scope.addMoreProcessing = 1;
            $scope.lstOrderProduct.push({
                'id': '',
                'product': '',
                'unit': null,
                'unitname': '',
                'price': null,
                'quantity': null
            });
            setTimeout(function () {
                // $('.selectpicker').selectpicker();
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

        $scope.getLastPrice = function( prodId ) {
            var lastPrice = 0;
            if( $scope.lastPrice[prodId] !== undefined ) lastPrice = $scope.lastPrice[prodId];
            return lastPrice;
        }

        function checkConflitWarehouse() {
            if (!$scope.khohang) return true;

            for( var i = 0; i < $scope.lstOrderProduct.length; i++){
                var productid = $scope.lstOrderProduct[i].product;
                if ( $scope.productwarehouse[productid] !== undefined && $scope.productwarehouse[productid].id !== undefined ) {
                    var id = $scope.productwarehouse[productid].id;
                    if ( $scope.khohang != id ) {
                        showMessage('warning', 'Sảm phầm ' + getProductName(productid)+" không nằm trong kho bạn đã chọn.");
                        return false;
                    }
                }
            }
            return true;
        }

        function getProductName( id ){
            var name = '';
            for( var i = 0; i<$scope.products.length; i++){
                if($scope.products[i].id == id){
                    name = $scope.products[i].name;
                    break;
                }
            }

            return name;
        }
    }])
    .controller('warehouseController', ['$scope', '$http', '$stateParams', 'showAlert', '$timeout', function ($scope, $http, $stateParams, showAlert, $timeout) {
        $scope.urlLoad = config.base + '/warehouse_wholesale';
        $scope.init = function (warehouse) {
            $('body').css('cursor', 'wait');
            $scope.currentWarehouse = warehouse;
            $http({
                method: 'GET',
                url: $scope.urlLoad + '?id=' + warehouse,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.products = data.products;
                angular.forEach($scope.products, function(pro){
                    pro.index = parseInt(pro.index);
                });
                $scope.lstWarehouse = data.listwarehouse;
                $scope.totalValue = data.totalValue;
                $scope.totalValueCurrentWarehouse = data.totalValueCurrentWarehouse;
                $timeout(function () {
                    $('#warehouse'+warehouse).addClass('active');
                    $('body').css('cursor', 'default');
                }, 0)
            }).error(function (data, status) {
                console.log(data);
                $('body').css('cursor', 'default');
            });
        };
        $scope.init(1);
        $scope.editInvetory = function (id, childid) {
            for (var i = 0; i < $scope.products.length; i++) {
                if ($scope.products[i].id == id) {
                    var temptrathuong = 0;
                    if (childid) {
                        for (var j = 0; j < $scope.products[i].danhsachhangtrathuong.length; j++) {
                            if ($scope.products[i].danhsachhangtrathuong[j].id == childid) {
                                $scope.products[i].danhsachhangtrathuong[j].inventorynotchange = false;
                            }
                            var value = $("#i" + $scope.products[i].danhsachhangtrathuong[j].product_id).val();
                            temptrathuong += parseInt(value);
                        }
                    } else {
                        $scope.products[i].inventorynotchange = false;
                    }
                    $scope.products[i].trathuong = temptrathuong;
                    break;
                }
            }
        }
        $scope.saveInventory = function (productid, childid) {
            var value = $("#i" + productid).val();
            var data = {product: productid, 'value': value, warehouse:$scope.currentWarehouse}
            for (var i = 0; i < $scope.products.length; i++) {
                if ($scope.products[i].product_id == productid) {
                    if (childid) {
                        for (var j = 0; j < $scope.products[i].danhsachhangtrathuong.length; j++) {
                            if ($scope.products[i].danhsachhangtrathuong[j].product_id == childid) {
                                data['product'] = childid;
                                data['id'] = $scope.products[i].danhsachhangtrathuong[j].id;
                                data['value'] = $("#i" + childid).val();
                                $scope.products[i].danhsachhangtrathuong[j].inventorynotchange = true;
                                break;
                            }
                        }
                    } else {
                        $scope.products[i].inventorynotchange = true;
                        data['id'] = $scope.products[i].id;
                    }
                    break;
                }
            }
            $http.post(config.base + '/Warehouse_wholesale/updateInventory', data).success(function () {
                showAlert.showSuccess(3000, 'Lưu thành công');
            });
        }

        $scope.changeWarehouse = function(id) {
            $scope.init(id);
            return false;
        }
    }])
    .controller('stockTransferController', ['$scope', '$http', 'showAlert', '$modal', function ($scope, $http, showAlert, $modal) {
        console.log('load stock transfer');
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/stock_transfer',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.wholesale_products = data.wholesale_products;
                $scope.retail_products = data.retail_products;
                $scope.products = data.products;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.transfer = function (size, el) {
            var quantity = $('#quantity_transfer_' + el.item.product_id).val();
            if (quantity === '' || isNaN(quantity)) {
                $('#quantity_transfer_' + el.item.product_id).addClass('error');
                alert('kiểm tra sản phẩm nhập');
                return false;
            }
            if (parseInt(quantity) > parseInt(el.item.quantity)) {
                $('#quantity_transfer_' + el.item.product_id).addClass('error');
                alert('Lỗi');
                return false;
            }
            var modalInstance = $modal.open({
                templateUrl: 'check_product',
                controller: 'checkProductCtrl',
                size: size,
                resolve: {
                    items: function () {
                        return {
                            retail: $scope.retail_products,
                            products: $scope.products,
                            product_id: el.item.product_id,
                            quantity: quantity
                        };
                    }
                }
            });
            modalInstance.result.then(function () {
                $scope.init();
            });
        };
    }])
    .controller('checkProductCtrl', function ($scope, $http, $modalInstance, items, showAlert) {
        $scope.retail_product = items.retail;
        $scope.products = items.products;
        $scope.searchProduct = '';
        $scope.search = '';
        $scope.viewTranfer = 0;
        $scope.titleLightbox = 'Kiểm tra sản phẩm';

        $scope.selectProduct = function () {
            if (!confirm('Chắc chứ'))
                return false;
            $http({
                method: 'post',
                url: config.base + '/stock_transfer/doTransfer',
                data: {
                    send_product: items.product_id,
                    recevie_proudct: this.item.product_id,
                    quantity: items.quantity
                },
                responseType: 'json'
            }).success(function (data, status) {
                showAlert.showSuccess(3000, 'Chuyển thành công');
                $modalInstance.close();

            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.addProduct = function () {
            if (!confirm("Bạn chắc chứ?"))
                return false;
            $http({
                method: 'post',
                url: config.base + '/stock_transfer/addProductToRetail',
                data: {
                    send_product: items.product_id,
                    recevie_proudct: this.item.id,
                    quantity: items.quantity
                },
                responseType: 'json'
            }).success(function (data, status) {
                showAlert.showSuccess(3000, 'Chuyển thành công');
                $modalInstance.close();
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.addWarehouse = function () {
            $scope.viewTranfer = 1;
            $scope.titleLightbox = 'Thêm sản phẩm vào kho';
        }
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('warehouseSaleController', ['$scope', '$http', '$location', 'showAlert', 'renderSelect', '$filter', 'productService', '$timeout',
        function ($scope, $http, $location, showAlert, renderSelect, $filter, productService, $timeout) {
            $scope.selectingorderproducts = [];
            $scope.init = function () {
                $scope.currentId = $location.search().i;
                $scope.lstOrderProduct = [];
                $scope.totalQuantity = 0;
                $scope.lstUser = [];
                $scope.currentUserDebit = 0;
                $scope.disableSave = false;
                $scope.addMoreProcessing = 0;
                $scope.selectedCus = 0;
                var d = new Date();
                $scope.currentDate = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
                setDefaultValue();
                $http.get(config.base + '/customers/getAll').then(function (response) {
                    response.data.unshift({id: 0, name: "Khách hàng vãng lai", store_name: "Khách hàng vãng lai", address: "Khách hàng vãng lai"});
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
                    $timeout(function () {
                        $("#select-user").selectpicker();
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
                            'price': null,
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

                        $("#select-customer").on("changed.bs.select", function() {
                            $("#select-user").selectpicker('toggle');
                        });

                        $("#select-user").on("changed.bs.select", function() {
                            $('.list_order_product .product_order:last-child .selectpicker').selectpicker('toggle');
                        });
                    })
                });

            };

            function setDefaultValue() {

                $scope.totalValue = 0;
                $scope.totalPromotion = 0;
                $scope.lstPromotion = [];
                $scope.order = {};
                $scope.order.note = '';
                $scope.order.thanhtoanhoadon = 0;
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
                $("body").css("cursor", "progress");
                $("#print-area").show();
                productService.printElement(document.getElementById("print-area"));
                window.print();
                $("#print-area").hide();
                $("body").css("cursor", "default");
                $scope.dainhoadon = 1;
            };
            $scope.selectCustomer = function () {
                $scope.currentCustomer = null;
                if ($scope.selectedCus) {
                    $scope.currentCustomer = setCustomer();
                    if($scope.selectedCus) {
                        $http.get(config.base + '/Debit/customerDebit?i=' + $scope.selectedCus).success(function (data, status) {
                            $scope.currentUserDebit = data.debit;
                        })
                    }
                }
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
                $scope.disableSave = true;
                var confirmMessage = "";
                if ( !$scope.dainhoadon ) confirmMessage = "Hóa đơn chưa được in.<br\>";

                if (!$scope.currentCustomer) confirmMessage += "Chưa chọn khách hàng.<br\>";
                if (!$scope.selectedUser) confirmMessage += "Chưa chọn saler.<br\>"

                confirmMessage += "Bạn muốn tạo hóa đơn này?";

                bootbox.confirm(confirmMessage, function(result) {
                    if ( result ) {

                        var orders = new Array();
                        for (var i = 0; i < $scope.lstOrderProduct.length; i++) {
                            if ($scope.lstOrderProduct[i].product) {
                                var order = {
                                    product_id: $scope.lstOrderProduct[i].product,
                                    cost: $scope.lstOrderProduct[i].cost,
                                    unit: '',
                                    price: $scope.lstOrderProduct[i].price,
                                    quantity: $scope.lstOrderProduct[i].quantity,
                                    total: $scope.lstOrderProduct[i].price * $scope.lstOrderProduct[i].quantity
                                };
                                orders.push(order);
                            } else {
                                bootbox.alert("Vui lòng chọn sản phẩm");
                                $scope.disableSave = false;
                                return false;
                            }
                        }

                        $scope.order.orders = orders;
                        $scope.order.total_price = $scope.totalValue;
                        $scope.order.customer_id = 0;
                        if ( $scope.currentCustomer ) $scope.order.customer_id = $scope.currentCustomer.id;
                        $scope.order.saler = $scope.selectedUser;

                        var url = config.base + '/order/saveOrderDirectSale';
                        $http({
                            method: 'POST',
                            url: url,
                            data: $scope.order,
                            responseType: 'json'
                        }).success(function (data, status) {
                            if( data.error == undefined || data.error == null || data.error == "" ) {
                                showAlert.showSuccess(3000, 'Lưu thành công');
                                setTimeout(function () {
                                    window.location.reload(true);
                                }, 3000);
                            } else {
                                showAlert.showError(3000, "Lưu không thành công: " + data.error);
                                $scope.disableSave = false;
                            }
                        }).error(function (data, status) {
                            console.log(data);
                            $scope.disableSave = false;
                        });
                    }
                    else {
                        $scope.disableSave = false;
                    }
                });
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
                calPromotionValue();
            }

            $scope.deleteProduct = function (index) {
                $scope.lstOrderProduct.splice(index, 1);
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
                            $scope.lstOrderProduct[index].inventory = parseInt($scope.danhSachSanPham[i].inventory);
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
                            'quantity': detail.quantity
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
        }])
    .controller('billController', ['$scope', '$http', '$stateParams', 'OrderPopover', function ($scope, $http, $stateParams, OrderPopover) {
        if ($stateParams.type === 'wholesale') {
            $scope.urlLoad = config.base + '/warehouse_wholesale_sale';
            $scope.product_name_type = 'Sỉ';
            $scope.type = 'wholesale';
        } else {
            $scope.urlLoad = config.base + '/warehouse_retail_sale';
            $scope.product_name_type = 'Lẻ';
            $scope.type = 'retail';
        }
        $scope.submiturl = config.base + '/#/bill/wholesale';
        $scope.metadata = [];
        $scope.orderList = [];
        $scope.shipmentMoneyDetail = [];
        $scope.moneyDiff = 0;
        $scope.search = '';
        $scope.init = function () {
            $http({
                method: 'GET',
                url: $scope.urlLoad,
                responseType: 'json'
            }).success(function (data, status) {
                //==== get data account profile ========
                $scope.bills = data.bills;
                $scope.metadata = data.meta;
                $scope.data = data.data;

            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.selectYear = function (year){
            $scope.metadata[year].show = !$scope.metadata[year].show;
        }
        $scope.selectMonth = function (year, month){
            $scope.metadata[year]['detail'][month].show = !$scope.metadata[year]['detail'][month].show;
        }
        $scope.selectDate = function(year, month, date) {
            $scope.metadata[year]['detail'][month]['detail'][date].show = !$scope.metadata[year]['detail'][month]['detail'][date].show;
        }
        $scope.selectTruck = function(year, month, date, truck) {
            $scope.metadata[year]['detail'][month]['detail'][date]['detail'][truck].show = !$scope.metadata[year]['detail'][month]['detail'][date]['detail'][truck].show;
        }
        $scope.selectChuyen = function(id) {
            $scope.loadbills(id);
            // $scope.selectedDate = date;
        }

        $scope.loadbills = function(shipid){
            $http({
                method: 'GET',
                url: config.base + '/bill_detail/viewShipmentBills?shipment_id=' + shipid,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.orderList = data.orderList;
                $scope.productList = data.productList;
                $scope.shipment = data.shipment;
                $scope.shipmentMoneyDetail = data.moneyDetail;
                $scope.moneyDiff = parseInt(data.shipmentValue) - parseInt(data.totalCash);

                callCustomerTotalProduct();

                $scope.shipment.date = new Date($scope.shipment.date);
                for (var i = 0; i < data.trucks.length; i++) {
                    if (data.trucks[i].id == $scope.shipment.truck_id) {
                        $scope.shipment['truck_name'] = data.trucks[i].name;
                        break;
                    }
                }

                //convert to int
                $.each($scope.orderList, function (i, value) {
                    $.each(value.bill_detail, function (j, product) {
                        $scope.orderList[i].bill_detail[j].quantity = parseInt(product.quantity);
                    })
                })

                setTimeout(function(){
                    $('#data-table tbody tr:odd').addClass('odd');
                    $('#data-table tbody tr:even').addClass('even');

                });
            }).error(function (data, status) {
                console.log(data);
            });
        }
        function callCustomerTotalProduct() {
            if ($scope.orderList) {
                $.each($scope.orderList, function (index, value) {
                    var sum = 0;
                    $.each(value.bill_detail, function (i, detail) {
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

        function countStandardBox(){
            var count = 0;
            var count1 = 0;
            $.each($scope.productList.detail, function(index, product) {
                if (product.product_name.toLowerCase().indexOf('ly') != -1) {
                    count += 2 * product.total_quantity;
                    count1 += 2 * product.total_returned;
                } else {
                    count += product.total_quantity;
                    count1 += product.total_returned;
                }
            });
            $scope.totalStandardBox = count;
            $scope.totalOriginalBox = count + count1;
        }
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
        $scope.getData = function() {
            $http({
                method: 'GET',
                url: $scope.urlLoad + "?from=" + $("input[name=from]").val() + "&to=" + $("input[name=to]").val() + "&search=" + $scope.search,
                responseType: 'json'
            }).success(function (data, status) {
                //==== get data account profile ========
                $scope.bills = data.bills;
                $scope.metadata = data.meta;
                $scope.data = data.data;

            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.getIndexOfProduct = function (order, proId) {
            var result = undefined;
            $.each(order.bill_detail, function (index, value) {
                if (value.product_id == proId) {
                    result = index;
                    return false;
                }
            });
            return result;
        }
        $scope.openBillDetail = function(id) {
            window.open(config.base + '/#/bill-detail/wholesale/' + id);
        }

        $scope.showPopover = function(dom){
            OrderPopover.init(dom, true);
        }
    }])
    .controller('billDetailController', ['$scope', '$http', '$stateParams', '$location', function ($scope, $http, $stateParams, $location) {
        console.log('load bill detail');
        $scope.url = config.base + '/bill_detail?id=' + $stateParams.id + '&type=' + $stateParams.type;
        $scope.init = function () {
            $http({
                method: 'GET',
                url: $scope.url,
                responseType: 'json'
            }).success(function (data, status) {
                //==== get data account profile ========
                $scope.bill = data.bill;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.backToList = function () {
            $location.path('bill/' + $stateParams.type);
        };
    }])
    .controller('warehouseDivideController', ['$scope', '$http', '$stateParams', '$location', function ($scope, $http, $stateParams, $location) {
        console.log('load warehouse divide');
        $scope.url = config.base + '/warehouse_divide?id=' + $stateParams.warehousing_id;
        $scope.init = function () {
            $http({
                method: 'GET',
                url: $scope.url,
                responseType: 'json'
            }).success(function (data, status) {
                //==== get data account profile ========
                if (data.warehousing.allow == 1) {
                    window.location = config.base + '/dashboard/page404';
                    return false;
                }
                $scope.renderTable(data.products, data.warehouses);

            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.renderTable = function (products, warehouses) {
            var html = '';
            for (var x in products) {
                html += '<tr>';
                html += '<td>' + products[x].stt + '</td>';
                html += '<td>' + products[x].detail.name + '</td>';
                html += '<td id="product_quantity_' + products[x].product_id + '">' + products[x].quantity + '</td>';
                html += '<td>' + products[x].unit.name + '</td>';
                html += '<td style="width: 300px">';
                html += '<div style="padding: 15px; width: 170px; margin-bottom: 10px">';
                html += '<div style="float: left;">Kho nhà </div>';
                html += '<div style="float: right; position: absolute"><input style="margin: -10px 0px 0px 100px;width: 60px" type="text" data-product-id="' + products[x].product_id + '" data-warehouse-id="0" id="warehouse_' + products[x].product_id + '" value="' + products[x].quantity + '"/></div>';
                html += '</div>';
                for (var y in warehouses) {
                    html += '<div style="padding: 15px; width: 170px; margin-bottom: 10px">';
                    html += '<div style="float: left;">' + warehouses[y].name + '</div>';
                    html += '<div style="float: right; position: absolute"><input style="margin: -10px 0px 0px 100px;width: 60px" class="storge_product_' + products[x].product_id + '" onkeyup="dividedQuantity(this)" data-product-id="' + products[x].product_id + '" data-warehouse-id="' + warehouses[y].id + ' "type="text" /></div>';
                    html += '</div>';
                }
                html += '</td>';
                html += '</tr>';
            }
            $('#list-product-divide').html(html);
        };
        $scope.init();
        $scope.divideWarehouse = function (el) {
            var list = new Array();
            $('input').each(function () {
                var product_id = $(this).data('product-id'),
                    warehouse_id = $(this).data('warehouse-id');
                if (list[warehouse_id])
                    list[warehouse_id].push({
                        product_id: product_id,
                        quantity: this.value
                    });
                else
                    list[warehouse_id] = new Array({
                        product_id: product_id,
                        quantity: this.value
                    });
            });
            $(el.currentTarget).attr('value', 'loading...')
            $http({
                method: 'POST',
                url: config.base + '/warehouse_divide/updateStorge',
                data: {
                    list: list,
                    warehousing_id: $stateParams.warehousing_id
                },
                responseType: 'json'
            }).success(function (data, status) {
                $location.path('product');
                $(el.currentTarget).attr('value', 'Phân kho')
            }).error(function (data, status) {
                console.log(data);
            });
        };
    }])
    .controller('warehouseListController', ['$scope', '$http', '$location', '$modal', function ($scope, $http, $location, $modal) {
        console.log('load warehouse list');
        $scope.openPopup = function (size, $event) {
            if ($event)
                var warehouses_id = $($event.currentTarget).data('id');

            var modalInstance = $modal.open({
                templateUrl: 'createWarehouse.html',
                controller: 'ModalInstanceCtrl',
                size: size,
                resolve: {
                    items: function () {
                        return warehouses_id;
                    }
                }
            });
            modalInstance.result.then(function () {
                $scope.init();
            });
        };
        $scope.url = config.base + '/warehouses';
        $scope.init = function () {
            $http({
                method: 'GET',
                url: $scope.url,
                responseType: 'json'
            }).success(function (data, status) {
                //==== get data account profile ========
                console.log(data);
                $scope.warehouses = data.warehouses;

            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        //                $scope.backToList = function(){
        //                    $location.path('bill/' + $stateParams.type);
        //                }
    }])
    .controller('ModalInstanceCtrl', function ($scope, $http, $modalInstance, items) {
        $scope.warehouse = {};
        if (items) {
            $http({
                method: 'GET',
                url: config.base + '/warehouses/getWarehouse/' + items,
                responseType: 'json'
            }).success(function (data, status) {
                //==== get data account profile ========
                console.log(data);
                $scope.warehouse = data.warehouse;

            }).error(function (data, status) {
                console.log(data);
            });
        }

        $scope.ok = function () {
            console.log($scope.warehouse);
            $http({
                method: 'POST',
                url: config.base + '/warehouses/addWarehouse',
                data: $scope.warehouse,
                responseType: 'json'
            }).success(function (data, status) {
                $modalInstance.close(data);
            }).error(function (data, status) {
                console.log(data);
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('warehouseStatusController', ['$scope', '$http', 'renderSelect', '$warehouses',
        function ($scope, $http, renderSelect, $warehouses) {
            console.log('load tình trạng kho');
            $scope.init = function () {
                $http({
                    method: 'GET',
                    url: config.base + '/warehouses/getAllWarehouses',
                    responseType: 'json'
                }).success(function (data, status) {
                    renderSelect.initDataSelect(data.products, '#filter_product_type', 'Sản phẩm', null, null, null, null, true);
                    $scope.initSelect();
                    $scope.warehouses = data.warehouses;
                }).error(function (data, status) {
                    console.log(data);
                });
            };
            $scope.init();
            $scope.deleteWarehouse = function ($event) {
                if (!confirm('Bạn chắc chứ?'))
                    return false
                var id = this.item.id,
                    warehouses_id = this.item.warehouses_id,
                    key = this.$index
                $warehouses.deleteWarehouses(id, warehouses_id, function (result) {
                    $scope.warehouses.splice(key, 1)
                })
            }
            $scope.initSelect = function () {
                $('select').not("select.chzn-select,select[multiple],select#box1Storage,select#box2Storage").selectmenu({
                    style: 'dropdown',
                    transferClasses: true,
                    width: null
                });

                // $(".chzn-select").chosen();
            };

        }
    ])
    .controller('warehouseOutOfStorgeController', ['$scope', '$http', function ($scope, $http) {

        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/warehouses/getProductOutOfStorge',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.products = data.products;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
    }])
    .controller('totalLiabilityController', ['$scope', '$http', function ($scope, $http) {
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/debit/totalLiability',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.bill = data;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.pay = function(parnerid) {
            var customer = undefined;
            $.each($scope.bill, function (key, value){
                if(value.id == parnerid) {
                    customer = value;
                }
            });
            if(customer) {
                var money = $("#pay" + parnerid).val();
                var r = confirm('Bạn thanh toán ' + money+' cho ' + customer.name + '?');
                if(r) {
                    $http({
                        method: 'POST',
                        url: config.base + '/debit/payLiability',
                        data:{parid:parnerid,debit:money.replace(new RegExp(',', 'g'),'')},
                        responseType: 'json'
                    }).success(function (data, status) {
                        window.location.reload();
                    }).error(function (data, status) {
                        console.log(data);
                    });
                }
            }
        }
        $scope.formatNumber = function(id) {
            $('#pay'+id).val(numeral($('#pay'+id).val()).format('0,0'));
        }
    }])
    .controller('totalLiabilityDetailController', ['$scope', '$http','$stateParams', function ($scope, $http,$stateParams) {
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/debit/totalLiabilityDetail?par='+$stateParams.parner_id,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.bill = data.bill;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
    }])
    .controller('totalDebitController', ['$scope', '$http', function ($scope, $http) {
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/debit/totalDebit',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.debits = data;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.pay = function(id){
            var customer = undefined;
            $.each($scope.debits, function (key, value){
                if(value.id == id) {
                    customer = value;
                }
            });
            if ( customer ) {
                if ( customer.tongLayHang > customer.tongTinNo ) {
                    var inputLabel = "Khách trả:";
                } else {
                    var inputLabel = "Tín trả:";
                }

                bootbox.prompt({
                    title: "Xử lý nợ " + customer.name + " - " + inputLabel,
                    callback: function( result ) {
                        if (result) {
                            result = parseFloat(result.replace(/,/g, ""));
                            if ( customer.tongLayHang > customer.tongTinNo ) {
                                var customerPaid = 1*result + 1*customer.tongTinNo;
                                var tinPaid = customer.tongTinNo;
                            } else {
                                var customerPaid = customer.tongLayHang;
                                var tinPaid = 1*result + 1*customer.tongLayHang;
                            }
                            if ( customerPaid != 0) {
                                payCustomer( customer, customerPaid );
                            }

                            if ( tinPaid != 0) {
                                payTin( customer, tinPaid );
                            }

                            setTimeout(function(){
                                window.location.reload();
                            });
                        }
                    },
                    className: "xu-ly-no-prompt",
                    onShown: function( e ){
                        $(".xu-ly-no-prompt .bootbox-input-text").keyup(function(event) {

                            // skip for arrow keys
                            if(event.which >= 37 && event.which <= 40) return;

                            // format number
                            $(this).val(function(index, value) {
                                return value
                                    .replace(/[^\d\.]/g, "")
                                    // .replace(/^([-\d][\d\.]*)-/, "$1")
                                    .replace(/(\.\d{0,2}).*/, "$1")
                                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    ;
                            });
                        });
                    }
                })

                setTimeout(function(){
                    $(".bootbox-input-text").attr('number-input', '');
                });
            }
        }

        function payCustomer(customer, paid) {

            $http({
                method: 'POST',
                url: config.base + '/debit/pay',
                async: false,
                data:{cusid:customer.id,debit:paid},
                responseType: 'json'
            }).success(function (data, status) {
            }).error(function (data, status) {
                console.log(data);
            });
        }

        function payTin(partner, paid) {

            $http({
                method: 'POST',
                async: false,
                url: config.base + '/debit/payLiability',
                data:{parid:partner.id,debit:paid},
                responseType: 'json'
            }).success(function (data, status) {
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.formatNumber = function(id) {
            $('#pay'+id).val(numeral($('#pay'+id).val()).format('0,0'));
        }
    }])
    .controller('totalDebitDetailController', ['$scope', '$http', '$stateParams', function ($scope, $http, $stateParams) {
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/debit/totalDebitDetail?cus='+$stateParams.customer_id,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.bill = data.bill;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
    }])
    .controller('warehousingHistoryController', ['$scope', '$http', function ($scope, $http) {
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/history/warehousingHistory',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.history = data.history;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
    }])
    .controller('warehousingDetailController', ['$scope', '$http', '$stateParams', function ($scope, $http, $stateParams) {
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/debit/warehousingDetail?id=' + $stateParams.id,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.bill = data.bill;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
    }])
    .controller('warehousesTransferController', ['$scope', '$http', function ($scope, $http) {
        $scope.transferList = new Array();
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/stock_transfer/initWarehousesTransfer',
                responseType: 'json'
            }).success(function (data, status) {
                var html_select = '';
                for (var x in data.warehouses) {
                    html_select += '<option value="' + data.warehouses[x].id + '">' + data.warehouses[x].name + '</option>';
                }
                $('.warehouses_list').html(html_select);
                $scope.initSelect();
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.initSelect = function () {
            $('select').not("select.chzn-select,select[multiple],select#box1Storage,select#box2Storage").selectmenu({
                style: 'dropdown',
                transferClasses: true,
                width: null
            });

            $(".chzn-select").chosen();
        };
        $scope.selectWarehouseFrom = function () {
            $http({
                method: 'GET',
                url: config.base + '/warehouses/getWarehouseStorge?id=' + $scope.warehouse_from,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.data_from = data.warehouses;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.selectWarehouseTo = function () {
            $http({
                method: 'GET',
                url: config.base + '/warehouses/getWarehouseStorge?id=' + $scope.warehouse_to,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.data_to = data.warehouses;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.doTransfer = function ($event) {
            var product_id = $($event.currentTarget).data('product-id'),
                quantity = parseInt($('#quantity_product_' + product_id).text()),
                value = parseInt($('#quantity_transfer_' + product_id).val().trim()),
                product_name = $($event.currentTarget).data('product-name'),
                unit = $($event.currentTarget).data('unit');

            if (value > quantity) {
                alert("Lỗi");
                return false;
            }
            if (isNaN(value)) {
                alert("Lỗi");
                return false;
            }
            $scope.transferList.push({
                remaining: (quantity - value),
                product_id: product_id,
                quantity: value,
                product_name: product_name,
                unit: unit
            });
            $('#quantity_product_' + product_id).text(quantity - value);
        };
        $scope.saveTransfer = function (el) {
            if (!$scope.warehouse_to) {
                alert('Chọn sản phẩm');
                return false;
            }
            if ($scope.transferList.length === 0) {
                alert('Chọn sản phẩm');
                return false;
            }
            if ($scope.warehouse_from == $scope.warehouse_to) {
                alert('Lỗi');
                return false;
            }
            $(el.currentTarget).text('loading...')
            $http({
                method: 'POST',
                url: config.base + '/stock_transfer/saveWarehouseTransfer',
                data: {
                    warehouse_from: $scope.warehouse_from,
                    warehouse_to: $scope.warehouse_to,
                    transfer: $scope.transferList
                },
                responseType: 'json'
            }).success(function (data, status) {
                $(el.currentTarget).text('Chuyển kho')
                $scope.selectWarehouseTo();
                $scope.selectWarehouseFrom();
                $scope.transferList = new Array();
            }).error(function (data, status) {
                console.log(data);
            });
        };
    }])
    .controller('warehousesExportController', ['$scope', '$http', function ($scope, $http) {
        $scope.getData = function() {
            var url = config.base + '/stock_transfer/getExport?wid=' + $scope.warehouseselect + '&date=' +$('input[name=reportdate]').val();
            $http({
                method: 'GET',
                url: url,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.exports = data;
                $scope.to_date = data.date;
                $scope.viewdate = data.date;
                $scope.totalValue = data.totalValue;
                $scope.totalValueCurrentWarehouse = data.totalValueCurrentWarehouse;
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.getClass = function(data) {
            if( parseInt(data) > 0) {
                return 'has-data';
            }
            return '';
        }

        $scope.sumInv = function(type) {
            var sum = 0;
            var odd = 0;
            if( !$scope.exports) return 0;
            for(var i=0;i<$scope.exports.data.length;i++){
                if(type == 'start') {
                    sum += parseInt($scope.exports.data[i].startdateinv.quantity);
                    odd += parseInt($scope.exports.data[i].startdateinv.odd_quantity);
                } else {
                    sum += parseInt($scope.exports.data[i].enddateinv.quantity);
                    odd += parseInt($scope.exports.data[i].enddateinv.odd_quantity);
                }
            }

            if (odd > 0) return sum + " (+" + odd + " lẻ)";
            return sum
        }

        $scope.sumReturned = function(){
            if( !$scope.exports) return 0;
            var sum = 0;
            for(var i=0;i<$scope.exports.data.length;i++){
                sum += parseInt($scope.exports.data[i].returned);
            }

            return sum;
        }

        $scope.sumImport = function( time ) {
            if( !$scope.exports) return 0;
            var sum = 0;
            for (var i = 0; i < $scope.exports.data.length; i++) {
                if ($scope.exports.data[i].import[time])
                    sum += parseInt($scope.exports.data[i].import[time].quantity);
            }

            return sum;
        }

        $scope.sumExport = function( tructId ) {
            if( !$scope.exports) return 0;
            var sum = 0;
            for (var i = 0; i < $scope.exports.data.length; i++) {
                if ($scope.exports.data[i].export[tructId])
                    sum += parseInt($scope.exports.data[i].export[tructId].quantity);
            }

            return sum;
        }

        $scope.sumDirectSale = function( time ) {
            if( !$scope.exports) return 0;
            var sum = 0;
            for (var i = 0; i < $scope.exports.data.length; i++) {
                if ($scope.exports.data[i].directsale[time])
                    sum += parseInt($scope.exports.data[i].directsale[time].quantity);
            }

            return sum;
        }

        $scope.getWarehouse = function() {
            var url = config.base + '/warehouses';
            $http({
                method: 'GET',
                url: url,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.listWarehouse = data.warehouses;
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.warehouseselect = 1;
        $scope.init = function () {
            $scope.viewdate = 0;
            $scope.getWarehouse();
            $scope.getData();
        };
        $scope.init();
        $scope.openTo = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.toOpened = true;
        };
        $scope.importtime = function(time, product) {
            if(product.import[time]) {
                return product.import[time].quantity;
            }
            return '';
        }

        $scope.exportTruct = function(tructId, product) {
            if(product.export[tructId]) {
                return parseInt(product.export[tructId].quantity) + parseInt(product.export[tructId].returned);
            }
            return 0;
        }
        $scope.directsaletime = function(time, product) {
            if(product.directsale[time]) {
                return product.directsale[time].quantity;
            }
            return '';
        }

        $scope.saveData = function() {
            var savedata = {date:$scope.viewdate, data:[]};
            for(var i = 0; i< $scope.exports.data.length; i++){
                savedata.data.push({id:$scope.exports.data[i].product_id, value:$scope.exports.data[i].deviation.manual_end_date})
            }
            $http({
                method: 'POST',
                data: savedata,
                url: config.base + '/stock_transfer/saveData',
                responseType: 'json'
            }).success(function (data, status) {
                showMessage('success', 'Dữ liệu đã được lưu.');
            }).error(function (data, status) {
                showMessage('error', 'Lưu dữ liệu không thành công!.');
                console.log(data);
            });
        }
    }])
    .controller('exportDetailController', ['$scope', '$http', '$stateParams', '$location', function ($scope, $http, $stateParams, $location) {
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/stock_transfer/getExportDetail?id=' + $stateParams.id,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.exports = data.exports;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.backToList = function () {
            $location.path('warehouses-export');
        };
    }])
    .controller('customersController', ['$scope', '$http', '$stateParams', '$modal', function ($scope, $http, $stateParams, $modal) {
        $scope.customer_type = $stateParams.type;
        $scope.permissionDenied = false;
        if ($stateParams.type === 'partner') {
            if(ROLE !== 1) {
                $scope.permissionDenied = true;
            } else {
                $scope.customer_name = 'Đối tác';
                $scope.type_customer = 'Ngành hàng';
            }
        } else {
            $scope.customer_name = 'Khách hàng';
            $scope.type_customer = 'Cửa hàng';
        }
        $scope.init = function () {
            if(! $scope.permissionDenied) {
                $http({
                    method: 'GET',
                    url: config.base + '/customers?type=' + $stateParams.type,
                    responseType: 'json'
                }).success(function (data, status) {
                    $scope.customers = data.customers;
                }).error(function (data, status) {
                    console.log(data);
                });
            }
        };
        $scope.init();
        $scope.deleteCustomer = function ($event) {
            if (!confirm('Chắc không'))
                return false;
            $http({
                method: 'GET',
                url: config.base + '/customers/deleteCustomer?id=' + $($event.currentTarget).attr('id'),
                responseType: 'json'
            }).success(function (data, status) {
                $scope.init();
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.openPopup = function (size, $event) {
            if ($event)
                var customer_id = $($event.currentTarget).data('id');
            var modalInstance = $modal.open({
                templateUrl: 'create_customer',
                controller: 'createCustomerController',
                size: size,
                resolve: {
                    items: function () {
                        return {
                            type: $stateParams.type,
                            customer_id: customer_id
                        };
                    }
                }
            });
            modalInstance.result.then(function () {
                $scope.init();
            });
        };
    }])
    .controller('createCustomerController', function ($scope, $http, $modalInstance, items) {
        $scope.customer = {};
        $scope.customer.type = items.type;
        if (items.type === 'partner')
            $scope.customer_name = 'Đối tác';
        else
            $scope.customer_name = 'khách hàng';
        if (items.customer_id) {
            $http({
                method: 'GET',
                url: config.base + '/customers/getCustomer?id=' + items.customer_id,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.customer = data.customer;

            }).error(function (data, status) {
                console.log(data);
            });
        }

        $scope.morePhone = function ($event) {
            var table = $($event.currentTarget).closest('table').data('class');
            var html = '<tr><td><input type="text" class="' + table.substr(5) + '"/></td><td></td></td></tr>';
            $('.' + table).append(html);
        }
        $scope.ok = function () {
            if (items.customer_id)
                var url = config.base + '/customers/editCustomer?id=' + items.customer_id;
            else
                var url = config.base + '/customers/createCustomer';

            //get phone home and phone mobile
            var phone_home = new Array();
            $('.phone_home').each(function () {
                if (this.value != '' && !isNaN(this.value))
                    phone_home.push(this.value);
            })
            var phone_mobile = new Array();
            $('.phone_mobile').each(function () {
                if (this.value != '' && !isNaN(this.value))
                    phone_mobile.push(this.value);
            })
            $scope.customer.phone_home = phone_home;
            $scope.customer.phone_mobile = phone_mobile;
            //console.log('customer: ', $scope.customer)
            $http({
                method: 'POST',
                url: url,
                data: $scope.customer,
                responseType: 'json'
            }).success(function (data, status) {
                $modalInstance.close(data);
            }).error(function (data, status) {
                console.log(data);
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('trucksController', ['$scope', '$http', '$modal', function ($scope, $http, $modal) {

        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/trucks',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.trucks = data.trucks;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.deleteTruck = function ($event) {
            if (!confirm('B?n ch?c ch??'))
                return false;
            $http({
                method: 'GET',
                url: config.base + '/trucks/deleteTruck?id=' + $($event.currentTarget).attr('id'),
                responseType: 'json'
            }).success(function (data, status) {
                $scope.init();
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.openPopup = function (size, $event) {
            if ($event)
                var truck_id = $($event.currentTarget).data('id');
            var modalInstance = $modal.open({
                templateUrl: 'create_truck',
                controller: 'createTruckCustomerController',
                size: size,
                resolve: {
                    items: function () {
                        return {
                            truck_id: truck_id
                        };
                    }
                }
            });
            modalInstance.result.then(function () {
                $scope.init();
            });
        };
    }])
    .controller('createTruckCustomerController', function ($scope, $http, $modalInstance, items) {
        $scope.truck = {};
        if (items.truck_id) {
            $http({
                method: 'GET',
                url: config.base + '/trucks/getTruck?id=' + items.truck_id,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.truck = data.truck;
            }).error(function (data, status) {
                console.log(data);
            });
        }

        $scope.ok = function () {
            if (items.truck_id)
                var url = config.base + '/trucks/editTruck?id=' + items.truck_id;
            else
                var url = config.base + '/trucks/createTruck';

            if (!$scope.truck.name) {
                alert('vui lòng chọn xe');
                return false;
            }

            $http({
                method: 'POST',
                url: url,
                data: $scope.truck,
                responseType: 'json'
            }).success(function (data, status) {
                $modalInstance.close(data);
            }).error(function (data, status) {
                console.log(data);
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('createStaffController', ['$scope', '$http', '$location', '$stateParams', 'renderSelect', function ($scope, $http, $location, $stateParams, renderSelect) {
        $scope.staff = {};
        $scope.init = function (staff_id) {
            $http({
                method: 'GET',
                url: config.base + '/staff/detailStaff?id=' + staff_id,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.staff = data.staff;

            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.getPosition = function () {
            $http({
                method: 'GET',
                url: config.base + '/staff/getPosition',
                responseType: 'json'
            }).success(function (data, status) {
                renderSelect.initDataSelect(data.position, '#staff_position', 'Vị trí', null, null, $scope.staff.position)
                renderSelect.initSelect();
            }).error(function (data, status) {
                console.log(data);
            });
        }

        if ($stateParams.id)
            $scope.init($stateParams.id);

        $scope.getPosition();
        $scope.uploadFile = function (files) {
            var fd = new FormData();
            //Take the first selected file
            fd.append("file", files[0]);

            $http.post(config.base + '/staff/uploadAvatar', fd, {
                withCredentials: true,
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: angular.identity
            }).success(function (data) {
                $('.avartar img').prop('src', 'www/img/avatar_staff/' + data);
                $scope.staff.avatar = data;
            }).error();

        };
        $scope.formatNumber = function ($event) {
            var value = $($event.currentTarget).val();
            $scope.staff.salary = value.replace(/,/ig, '');
            $($event.currentTarget).val(numeral($scope.staff.salary).format('0,0'))
        }

        $scope.saveStaff = function () {
            if ($stateParams.id)
                var url = config.base + '/staff/editStaff?id=' + $stateParams.id;
            else
                var url = config.base + '/staff/createStaff';

            $http({
                method: 'POST',
                url: url,
                data: $scope.staff,
                responseType: 'json'
            }).success(function (data, status) {
                $location.path('staff');
            }).error(function (data, status) {
                console.log(data);
            });
        }
    }])
    .controller('staffController', ['$scope', '$http', '$location', function ($scope, $http, $location) {
        $scope.init = function () {
            $http({
                method: 'POST',
                url: config.base + '/staff',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.staffs = data.staffs;
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.init();
        $scope.editStaff = function () {
            $location.path('staff-edit/' + this.item.id);
        }
        $scope.deleteStaff = function(id) {
            bootbox.confirm("Xóa nhân viên?", function(result){
                if (result === true) {
                    $http({
                        method: 'POST',
                        url: config.base + '/staff/delete',
                        data: {id: id}
                    }).success(function () {
                        location.reload();
                    })
                }
            })

        }
    }])

    .controller('addProductController', function ($scope, $http, $modalInstance, renderSelect) {
        $scope.order = {};
        $scope.product_id = 0;
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/order/addProductPopup',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.products = data.products;
                $scope.units = data.units;
                renderSelect.initDataSelect(data.products, '#tr_order_1 select.load_product', 'Sản phẩm', true);
                renderSelect.initSelect();
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.init();
        $scope.selectProduct = function () {
            var target_id = $(event.currentTarget).closest('tr').data('id');
            $scope.products.forEach(function (product) {
                if (product.code === $('#tr_order_' + target_id).children('td:nth-child(3)').children('select.load_product').val()) {
                    $('#tr_order_' + target_id + ' td:nth-child(5)').html('<select data-placeholder="Quy cách" ng-model="select_unit" onchange="angular.element(this).scope().selectUnit()" class="chzn-select load_unit"></select>');
                    renderSelect.initDataSelect(product.sale_price, '#tr_order_' + target_id + ' select.load_unit', 'Quy cách');
                    if (product.buy_price) {
                        $('#tr_order_' + target_id).children('td:nth-child(4)').children('input.show_buy').val(numeral(parseInt(product.buy_price[0].price) / parseInt(product.buy_price[0].quantity)).format('0,0'));
                        $('#tr_order_' + target_id).children('td:nth-child(4)').children('input.show_buy_origin').val(product.buy_price[0].id);
                    }
                    renderSelect.initSelect();
                    return false;
                }
            });
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
            var target_id = $(event.currentTarget).closest('tr').data('id'),
                quantity = parseInt($(event.currentTarget).val()),
                price = parseInt($('#tr_order_' + target_id).children('td:nth-child(6)').children('input.show_sale_origin').val());

            if (isNaN(quantity)) {
                quantity = 0;
                $('#tr_order_' + target_id).children('td:nth-child(8)').children('span').html('');
            }
            var format_price = numeral(quantity * price).format('0,0');
            $('#tr_order_' + target_id).children('td:nth-child(8)').children('span').html('<h5>' + format_price + '</h5>');
            $('#tr_order_' + target_id).children('td:nth-child(8)').children('input').val(quantity * price);
            var total_order = 0;
            $('.price_order').each(function () {
                total_order += parseInt(this.value);
            });
            $('#total_order').html(numeral(total_order).format('0,0'));
            $('#txt_hide_total_bill').val(total_order);
        };
        $scope.ok = function () {
            var product_id = $('.load_product').val();
            $scope.order.cost = $('.show_buy_origin').val();
            $scope.order.unit = $('.load_unit').val();
            $scope.order.price = $('.show_sale_origin').val();
            $scope.order.total = $('.price_order').val();

            //get product id
            for (var x in $scope.products) {
                if ($scope.products[x].code == product_id) {
                    $scope.order.product_id = $scope.products[x].id;
                    break;
                }
            }

            $http({
                method: 'GET',
                url: config.base + '/order/getInventory?unit=' + $scope.order.unit,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.order.product_detail = data.product_detail
                $scope.order.unit_detail = data.unit_detail
                $modalInstance.close($scope.order);
            }).error(function (data, status) {
                console.log(data);
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('listUserController', ['$scope', '$http', '$modal', 'renderSelect', function ($scope, $http, $modal, renderSelect) {

        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/user',
                responseType: 'json'
            }).success(function (data, status) {
                $scope.users = data.users;
                $scope.roles = data.roles;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
        $scope.deleteUser = function ($event) {
            if (!confirm('Chắc không?'))
                return false;
            $http({
                method: 'GET',
                url: config.base + '/user/deleteUser?id=' + $($event.currentTarget).attr('id'),
                responseType: 'json'
            }).success(function (data, status) {
                $scope.init();
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.openPopup = function (size, $event) {
            if ($event)
                var user_id = $($event.currentTarget).data('id');
            var modalInstance = $modal.open({
                templateUrl: 'create_user',
                controller: 'createUserController',
                size: size,
                resolve: {
                    items: function () {
                        return {
                            user_id: user_id,
                            roles: $scope.roles
                        };
                    }
                }
            });
            modalInstance.result.then(function () {
                $scope.init();
            });
        };
    }])
    .controller('createUserController', function ($scope, $http, $modalInstance, items, renderSelect) {
        $scope.user = {};
        if (items.user_id) {
            $http({
                method: 'GET',
                url: config.base + '/user/getUser?id=' + items.user_id,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.user = data.user;
            }).error(function (data, status) {
                console.log(data);
            });
        }
        setTimeout(function () {
            renderSelect.initDataSelect(items.roles, '#user_role', 'Quyền', null, null, $scope.user.role);
            renderSelect.initSelect();
        }, 1000);

        $scope.ok = function () {
            if (items.user_id)
                var url = config.base + '/user/editUser?id=' + items.user_id;
            else
                var url = config.base + '/user/createUser';

            if (!$scope.user.user_name) {
                alert('vui lòng điền tên');
                return false;
            }

            $http({
                method: 'POST',
                url: url,
                data: $scope.user,
                responseType: 'json'
            }).success(function (data, status) {
                $modalInstance.close(data);
            }).error(function (data, status) {
                console.log(data);
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    })
    .controller('shipmentController', ['$scope', '$http', function ($scope, $http) {

        $scope.shipments = new Array();
        $scope.open = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.opened = true;
        };
        $scope.findShipment = function () {
            if (!$scope.from_date || !$scope.to_date)
                return false;

            //get shipment
            $http({
                method: 'GET',
                url: config.base + '/shipment?from=' + $('#from_date').val() + '&to=' + $('#to_date').val(),
                responseType: 'json'
            }).success(function (data, status) {
                $scope.shipments = data.shipments;
            }).error(function (data, status) {
                console.log(data);
            });
        }
    }])
    .controller('shipmentDetailController', ['$scope', '$http', '$stateParams', function ($scope, $http, $stateParams) {

        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/shipment/shipmentDetail?id=' + $stateParams.shipment_id,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.shipment = data.shipment;
            }).error(function (data, status) {
                console.log(data);
            });
        }
        $scope.init();
    }])
    .controller('ProductUnit', ['$scope', 'productService', '$http', function ($scope, productService, $http) {
        var init = function () {
            $scope.newUnit = '';
            $scope.sourceConvert = '';
            $scope.productConvert = '';
            $scope.targetConvert = '';
            $scope.numberConvert = '';
            $scope.isPrefix = true;

            loadUnit();
        };
        init();

        $scope.SaveNewUnit = function () {

            if ($scope.newUnit != null && $scope.newUnit.trim() != '') {
                $http.post(config.base + '/ProductUnit/create', {
                    'name': $scope.newUnit,
                    'is_prefix': ($scope.isPrefix ? 1 : 0)
                }).then(function (response) {
                    showMessage('success', 'Quy cách mới đã được lưu.');
                    $scope.newUnit = null;
                    $scope.isPrefix = true;
                    loadUnit();
                }, function () {
                    showMessage('error', 'Lưu không thành công. Vui lòng thử lại hoặc liên hệ quản trị viên!')
                });
            }
        }

        $scope.EditUnit = function (index, id) {
            $http.post(config.base + '/ProductUnit/update', {
                'id': id,
                'name': angular.element("input[name=unit-" + index + "]").val()
            }).then(function (response) {
                showMessage('success', 'Quy cách đã được cập nhật.');
            }, function () {
                showMessage('error', 'Cập nhật không thành công. Vui lòng thử lại hoặc liên hệ quản trị viên!')
            });
        }

        $scope.DeleteUnit = function (index, id) {
            bootbox.confirm("Xóa quy cách [" + angular.element("input[name=unit-" + index + "]").val() + "]?", function (result) {
                if (result == true) {
                    $http.post(config.base + '/ProductUnit/delete', {'id': id}).then(function (response) {
                        showMessage('success', 'Đã xóa quy cách ' + angular.element("input[name=unit-" + index + "]").val());
                        $scope.lstUnit.splice(index, 1);
                    }, function () {
                        showMessage('error', 'Xóa nhật không thành công. Vui lòng thử lại hoặc liên hệ quản trị viên!')
                    });
                }
            });
        }

        function loadUnit() {
            var objGetProducts = productService.getProducts();
            objGetProducts.then(function (data) {
                $scope.lstUnit = data.units;
                $scope.lstProduct = data.products;
            });
        }
    }])
    .controller('importDetailController', ['$scope', '$http', '$stateParams', '$location', function ($scope, $http, $stateParams, $location) {
        $scope.url = config.base + '/bill_detail/viewImportDetail?id=' + $stateParams.id;
        $scope.init = function () {
            $http({
                method: 'GET',
                url: $scope.url,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.importDetail = data.detail;
                $scope.warehousing = data.warehousing;
                $scope.partner = data.partner;
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
    }])
    .controller('printingDebitController', ['$scope', '$http', '$stateParams', '$location', function ($scope, $http, $stateParams, $location) {
        $scope.url = config.base + '/Debit/getPrintingDebit?id=' + $stateParams.id;
        var d = new Date();
        $scope.currentDate = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
        $scope.tongTinNo = 0;
        $scope.tonglayHang = 0;
        $scope.init = function () {
            $http({
                method: 'GET',
                url: $scope.url,
                responseType: 'json'
            }).success(function (data, status) {
                $scope.bills = data.bills;
                $scope.imports = data.imports;
                $scope.customer = data.customer;
                $scope.startDate = data.startDate;
                $.each($scope.bills, function (index, item){
                    $scope.tonglayHang += parseInt(item.debit);
                });
                $.each($scope.imports, function (index, item){
                    $scope.tongTinNo += parseInt(item.debit);
                });
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init();
    }])