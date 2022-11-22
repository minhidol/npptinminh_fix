'use strict';

angular.module('promotion.controllers', ['ui.bootstrap'])
    .controller('promotionBoardController', ['$scope', '$http', 'showAlert', 'productService', '$location', function ($scope, $http, showAlert, productService, $location) {
        $scope.init = function () {
            $http.get(config.base + '/promotion/getList').then(function (response) {
                $scope.lstPromotion = response.data;
            });
            var objGetProducts = productService.getProducts();
            objGetProducts.then(function (data) {
                $scope.danhSachDonVi = data.units;
                $scope.danhSachSanPhamPrim = angular.copy(data.products);
                $scope.danhSachSanPham = productService.prepareProductName(data.products, data.units, false);
            });

            $scope.addedKhuyenMai = [];
            $scope.nothingToSave = true;
            $scope.deletedItem = [];
            $scope.selectedPromotion = undefined;
            $scope.currentState = 'Tất cả';
            $scope.searchText = '';
        };

        $scope.init();

        $scope.ShowDetail = function (id) {
            $scope.addedKhuyenMai = [];
            loadPromotion(id);
            $scope.selectedPromotion = id;
        };

        $scope.deletePro = function (index, id) {
            $scope.addedKhuyenMai.splice(index, 1);
            $scope.nothingToSave = false;
            $scope.deletedItem.push(id);
        }

        $scope.refreshPromotion = function () {
            $scope.addedKhuyenMai = [];
            loadPromotion($scope.selectedPromotion);
        }

        $scope.changeState = function (newState) {
            $scope.currentState = newState;
        }

        $scope.filterState = function (lstItems) {
            return function (item) {
                return (($scope.currentState === 'Tất cả' || item.trangthai === $scope.currentState) && ($scope.searchText.length == 0 || item.name.toLowerCase().indexOf($scope.searchText.toLowerCase()) > -1));
            }
        }

        $scope.Delete = function (id) {
            var index = -1;
            for (var i = 0; i < $scope.lstPromotion.length; i++) {
                if ($scope.lstPromotion[i].id == id) {
                    index = i;
                    break;
                }
            }
            if (index >= 0) {
                bootbox.confirm("Xóa khuyến mãi " + $scope.lstPromotion[index].name + '?', function (result) {
                    if (result === true) {
                        $http.post(config.base + '/promotion/delete', {'id': id}).then(function (response) {
                            $scope.lstPromotion.splice(index, 1);
                            $scope.addedKhuyenMai = [];
                            $scope.tenKhuyenMai = '';
                            showMessage('success', 'Đã xóa khuyến mãi.')
                        });
                    }
                })
            }
        }

        $scope.Edit = function (id) {
            $location.url('/promotion-create?i=' + id);
        }

        $scope.savePromotion = function () {
            if ($scope.deletedItem.length > 0) {
                var postData = {'meta_id': $scope.selectedPromotion, 'deletedItem': $scope.deletedItem};
                $http.post(config.base + '/promotion/deleteDetail', postData).then(function () {
                    showMessage('success', 'Khuyến mãi đã được lưu.')
                    $scope.deletedItem = [];
                });
            }
        }

        function loadPromotion(id) {
            if (id != undefined && id != null) {
                $http.get(config.base + '/promotion/get?i=' + id).then(function (response) {
                    $scope.tenKhuyenMai = response.data.meta.name;
                    $scope.kmTn = response.data.meta.start_date;
                    $scope.kmDn = response.data.meta.end_date;

                    for (var i = 0; i < response.data.details.length; i++) {
                        var detailData = response.data.details[i];
                        var objDkSp = {
                            "id": detailData.product_id,
                            "name": getProductNameById(detailData.product_id, false),
                            "soLuong": detailData.product_number
                        };
                        var objDkAmount = {
                            "value": detailData.receipt_amout,
                            "display": (detailData.receipt_amout != null && detailData.receipt_amout > 0) ? detailData.receipt_amout + " (nghìn đồng)" : ''
                        };
                        var objChietKhau = {"type": "", "value": "", "display": ""};
                        if (detailData.money_discount != null && detailData.money_discount > 0) {
                            objChietKhau.type = 'money';
                            objChietKhau.value = detailData.money_discount;
                            objChietKhau.display = detailData.money_discount + " (nghìn đồng)";
                        }
                        else if (detailData.percent_discount != null && detailData.percent_discount > 0) {
                            objChietKhau.type = 'percent';
                            objChietKhau.value = detailData.percent_discount;
                            objChietKhau.display = detailData.percent_discount + "%";
                        }

                        var objTang = {"id": "", "unit": "", "number": "", "other": "", "display": ""};
                        if (detailData.other_gift != null && detailData.other_gift != '') {
                            objTang.other = detailData.other_gift;
                            objTang.display = detailData.other_gift;
                        } else if (detailData.product_gift != null && detailData.product_gift != '' && detailData.product_gift > 0) {
                            objTang.id = detailData.product_gift;
                            objTang.unit = detailData.product_gift_unit;
                            objTang.number = detailData.product_gift_no;
                            var displayName = productService.createProductName(getProductNameById(detailData.product_gift, true), detailData.product_gift_unit, $scope.danhSachDonVi);
                            objTang.display = "Tặng " + detailData.product_gift_no + " " + displayName;
                        }

                        var objKM = {
                            "id": detailData.id,
                            "dk": {"sanPham": objDkSp, "doanhThu": objDkAmount},
                            "ud": {"chietKhau": objChietKhau, "tang": objTang}
                        };

                        $scope.addedKhuyenMai.push(objKM);
                    }
                });
            }

            $scope.nothingToSave = true;
        }

        function getProductNameById(id, isPrim) {
            var productNameList = isPrim ? $scope.danhSachSanPhamPrim : $scope.danhSachSanPham;
            for (var i = 0; i < productNameList.length; i++) {
                if (productNameList[i].id == id) {
                    return angular.copy(productNameList[i].name);
                }
            }
            return '';
        }
    }])
    .controller('promotionProductGiveProductController', ['$scope', '$http', 'showAlert', 'renderSelect', function ($scope, $http, showAlert, renderSelect) {
        $scope.unitList = [];
        $scope.init = function () {
            $http({
                method: 'GET',
                url: config.base + '/warehouse_wholesale/addWholesale',
                reponseType: 'json'
            }).success(function (data, status) {
                $scope.products = data.products;
                renderSelect.initDataSelect(data.products, '.load_product', 'Sản phẩm', true);
                renderSelect.initSelect();
            }).error(function (data, status) {
                console.log(data);
            });
        };
        $scope.init()
        $scope.loadUnitProduct = function (el) {
            console.log(el)
        }
        $scope.createPromotion = function () {
            console.log($scope.proGive)
        };
    }])
    .controller('promotionProductGiveDiscountController', ['$scope', '$http', 'showAlert', function ($scope, $http, showAlert) {
        console.log('this prop give dis')
    }])
    .controller('promotionRevenueGiveDiscountController', ['$scope', '$http', 'showAlert', function ($scope, $http, showAlert) {
        console.log('this revenu give prop')
    }])

    .controller('promotionCreateController', ['$scope', '$http', 'productService', '$location', function ($scope, $http, productService, $location) {
        $scope.init = function () {
            clearAll(true);
            var objGetProducts = productService.getProducts();
            objGetProducts.then(function (data) {
                $scope.danhSachDonVi = data.units;
                $scope.danhSachSanPhamPrim = angular.copy(data.products);
                $scope.danhSachSanPham = productService.prepareProductName(data.products, data.units, false);
                loadPromotion();
                setTimeout(function () {
                    $(".selectpicker").selectpicker();
                }, 1000);
            });
        };

        $scope.init();

        $scope.themKhuyenMai = function () {
            var objDkSp = {"id": "", "name": "", "soLuong": ""};
            if ($scope.kmDkSp != "" && $scope.kmDkSp != null) {
                var objKnDkSp = angular.fromJson($scope.kmDkSp);
                var kmDkSlSp = parseInt($scope.kmDkSlSp.replace(/,/ig, ''));
                objDkSp = {"id": objKnDkSp.id, "name": objKnDkSp.name, "soLuong": kmDkSlSp};
            }

            var objDkAmount = {"value": '', "display": ''};
            if ($scope.kmDkGtDh) {
                var kmDkGtDh = parseInt($scope.kmDkGtDh.replace(/,/ig, ''));
                objDkAmount = {"value": kmDkGtDh, "display": kmDkGtDh + " (vnđ)"};
            }

            var objChietKhau = {"type": "", "value": "", "display": ""};
            if ($scope.udCkT) {
                var udCkT = parseInt($scope.udCkT.replace(/,/ig, ''));
                objChietKhau = {"type": "money", "value": udCkT, "display": udCkT + " (vnđ)"};
            }
            else if ($scope.udCkPt) {
                var udCkPt =  parseInt($scope.udCkPt.replace(/,/ig, ''));
                objChietKhau = {"type": "percent", "value": udCkPt, "display": udCkPt + "%"};
            }

            var objTang = {"id": "", "unit": "", "number": "", "other": "", "display": ""};
            if ($scope.udQtSp != "" && $scope.udQtSp != null) {
                var objUdQtSp = angular.fromJson($scope.udQtSp);
                var objUdQtDvt = angular.fromJson($scope.udQtDvt);
                var udQtSlSp = parseInt($scope.udQtSlSp.replace(/,/ig, ''));
                objTang.id = objUdQtSp.id;
                objTang.unit = objUdQtDvt.id;
                objTang.number = udQtSlSp;
                var displayName = productService.createProductName(objUdQtSp.name, objUdQtDvt.id, $scope.danhSachDonVi);
                objTang.display = "Tặng " + $scope.udQtSlSp + " " + displayName;
            }
            else if ($scope.udQtK != "" && $scope.udQtK != null) {
                objTang.other = $scope.udQtK;
                objTang.display = $scope.udQtK;
            }

            var objKM = {
                "id": '',
                "dk": {"sanPham": objDkSp, "doanhThu": objDkAmount},
                "ud": {"chietKhau": objChietKhau, "tang": objTang}
            };

            $scope.addedKhuyenMai.push(objKM);
            clearAll(false);
        };

        $scope.savePromotion = function () {
            $scope.isSubmit = true;
            if (checkSubmitCondition()) {
                var savedObj = prepareSavingData();
                var url = $scope.currentId !== undefined ? config.base + '/promotion/update?i=' + $scope.currentId : config.base + '/promotion/create';
                $http.post(url, savedObj).then(function (response) {
                    if (response.data == 'success') {
                        showMessage('success', 'Đã lưu khuyến mãi thành công.');
                        clearAll($scope.currentId == undefined);
                        $scope.metaForm.$setPristine();
                    }
                    else showMessage('error', 'Lưu khuyến mãi không thành công. Vui lòng thử lại hoặc liên hệ nhà phát triển');
                });
                return true;
            } else {
                return false;
            }
        }

        $scope.deletePro = function (index) {
            $scope.addedKhuyenMai.splice(index, 1);
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

        $scope.DieukienSanphamChange = function () {
            if (($scope.kmDkSp == '' || $scope.kmDkSp == null) && ($scope.kmDkSlSp == '' || $scope.kmDkSlSp == null)) {
                $scope.haveValueCondition = false;
                $scope.haveProductCondition = false;
            }
            else {
                $scope.haveValueCondition = false;
                $scope.haveProductCondition = true;
            }

            $scope.kmDkSlSp = numeral($scope.kmDkSlSp).format('0,0');
        }

        $scope.DieuKienGiaTriChange = function () {
            if ($scope.kmDkGtDh == '' || $scope.kmDkGtDh == null) {
                $scope.haveValueCondition = false;
                $scope.haveProductCondition = false;
            }
            else {
                $scope.haveValueCondition = true;
                $scope.haveProductCondition = false;
            }

            $scope.kmDkGtDh = numeral($scope.kmDkGtDh).format('0,0');
        }

        $scope.changeQuaTangSanPham = function () {
            if (($scope.udQtSp == '' || $scope.udQtSp == null) && (!$scope.udQtSlSp) && ($scope.udQtDvt == '' || $scope.udQtDvt == null)) {
                $scope.disableQuatangSanpham = false;
                $scope.disableDiscountMoney = false;
                $scope.disableDiscountPercent = false;
                $scope.disableOtherGift = false;
            }
            else {
                $scope.disableQuatangSanpham = false;
                $scope.disableDiscountMoney = true;
                $scope.disableDiscountPercent = true;
                $scope.disableOtherGift = true;
            }

            $scope.udQtSlSp = numeral($scope.udQtSlSp).format('0,0');
        }

        $scope.changeChietKhauTien = function () {
            if ($scope.udCkT == '' || $scope.udCkT == null) {
                $scope.disableQuatangSanpham = false;
                $scope.disableDiscountMoney = false;
                $scope.disableDiscountPercent = false;
                $scope.disableOtherGift = false;
            }
            else {
                $scope.disableQuatangSanpham = true;
                $scope.disableDiscountMoney = false;
                $scope.disableDiscountPercent = true;
                $scope.disableOtherGift = true;
            }

            $scope.udCkT = numeral($scope.udCkT).format('0,0');
        }

        $scope.changeChietKhauPhanTram = function () {
            if (!$scope.udCkPt) {
                $scope.disableQuatangSanpham = false;
                $scope.disableDiscountMoney = false;
                $scope.disableDiscountPercent = false;
                $scope.disableOtherGift = false;
            }
            else {
                $scope.disableQuatangSanpham = true;
                $scope.disableDiscountMoney = true;
                $scope.disableDiscountPercent = false;
                $scope.disableOtherGift = true;
            }

            $scope.udCkPt = numeral($scope.udCkPt).format('0,0');
        }

        $scope.changeQuaTangKhac = function () {
            if ($scope.udQtK == '' || $scope.udQtK == null) {
                $scope.disableQuatangSanpham = false;
                $scope.disableDiscountMoney = false;
                $scope.disableDiscountPercent = false;
                $scope.disableOtherGift = false;
            }
            else {
                $scope.disableQuatangSanpham = true;
                $scope.disableDiscountMoney = true;
                $scope.disableDiscountPercent = true;
                $scope.disableOtherGift = false;
            }
        }

        $scope.addUnit = function () {
            $("#warning").text('');
            $("#unitModal").modal('show');
        }

        $scope.SaveNewUnit = function () {
            $("#warning").text('');
            if ($("input[name=new-unit]").val().trim() != '') {
                $http.post(config.base + '/ProductUnit/create', {
                    'name': $("input[name=new-unit]").val(),
                    'is_prefix': ($("input[name=unit-prefix]").prop('checked') ? 1 : 0)
                })
                    .then(function () {
                        selectLastUnit();
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

        function prepareSavingData() {
            var savedObj = {
                "meta": {"name": $scope.tenKhuyenMai, "start_date": $scope.kmTn, "end_date": $scope.kmDn},
                "details": []
            };
            var detailData = [];
            for (var i = 0; i < $scope.addedKhuyenMai.length; i++) {
                var objKM = angular.copy($scope.addedKhuyenMai[i]);
                var detail = {
                    'id': objKM.id,
                    'product_id': objKM.dk.sanPham.id,
                    'receipt_amout': objKM.dk.doanhThu.value,
                    'product_number': objKM.dk.sanPham.soLuong,
                    'product_gift': objKM.ud.tang.id,
                    'product_gift_no': objKM.ud.tang.number,
                    'product_gift_unit': objKM.ud.tang.unit,
                    'money_discount': (objKM.ud.chietKhau.type == 'money') ? objKM.ud.chietKhau.value : '',
                    'percent_discount': (objKM.ud.chietKhau.type == 'percent') ? objKM.ud.chietKhau.value : '',
                    'other_gift': objKM.ud.tang.other
                };

                detailData.push(detail);
            }
            savedObj.details = detailData;
            return savedObj;
        }

        function checkSubmitCondition() {
            return $scope.tenKhuyenMai != null
                && $scope.tenKhuyenMai != ''
                && $scope.kmTn != null
                && $scope.kmTn != ''
                && $scope.kmDn != null
                && $scope.kmDn != '';
        }

        function getProductNameById(id, isPrim) {
            var productNameList = isPrim ? $scope.danhSachSanPhamPrim : $scope.danhSachSanPham;
            for (var i = 0; i < productNameList.length; i++) {
                if (productNameList[i].id == id) {
                    return angular.copy(productNameList[i].name);
                }
            }
            return '';
        }

        function loadPromotion() {
            $scope.currentId = $location.search().i;
            if ($scope.currentId != undefined && $scope.currentId != null) {
                $http.get(config.base + '/promotion/get?i=' + $scope.currentId).then(function (response) {
                    $scope.tenKhuyenMai = response.data.meta.name;
                    $scope.kmTn = response.data.meta.start_date;
                    $scope.kmDn = response.data.meta.end_date;

                    for (var i = 0; i < response.data.details.length; i++) {
                        var detailData = response.data.details[i];
                        var objDkSp = {
                            "id": detailData.product_id,
                            "name": getProductNameById(detailData.product_id, false),
                            "soLuong": detailData.product_number
                        };
                        var objDkAmount = {
                            "value": detailData.receipt_amout,
                            "display": (detailData.receipt_amout != null && detailData.receipt_amout > 0) ? detailData.receipt_amout + " (nghìn đồng)" : ''
                        };
                        var objChietKhau = {"type": "", "value": "", "display": ""};
                        if (detailData.money_discount != null && detailData.money_discount > 0) {
                            objChietKhau.type = 'money';
                            objChietKhau.value = detailData.money_discount;
                            objChietKhau.display = detailData.money_discount + " (nghìn đồng)";
                        }
                        else if (detailData.percent_discount != null && detailData.percent_discount > 0) {
                            objChietKhau.type = 'percent';
                            objChietKhau.value = detailData.money_discount;
                            objChietKhau.display = detailData.money_discount + "%";
                        }

                        var objTang = {"id": "", "unit": "", "number": "", "other": "", "display": ""};
                        if (detailData.other_gift != null && detailData.other_gift != '') {
                            objTang.other = detailData.other_gift;
                            objTang.displayName = detailData.other_gift;
                        } else if (detailData.product_gift != null && detailData.product_gift != '' && detailData.product_gift > 0) {
                            objTang.id = detailData.product_gift;
                            objTang.unit = detailData.product_gift_unit;
                            objTang.number = detailData.product_gift_no;
                            var displayName = productService.createProductName(getProductNameById(detailData.product_gift, true), detailData.product_gift_unit, $scope.danhSachDonVi);
                            objTang.display = "Tặng " + detailData.product_gift_no + " " + displayName;
                        }

                        var objKM = {
                            "id": detailData.id,
                            "dk": {"sanPham": objDkSp, "doanhThu": objDkAmount},
                            "ud": {"chietKhau": objChietKhau, "tang": objTang}
                        };

                        $scope.addedKhuyenMai.push(objKM);
                    }
                });
            }
        }

        function clearAll(includeMeta) {
            if (includeMeta) {
                $scope.tenKhuyenMai = '';
                $scope.kmTn = '';
                $scope.kmDn = '';
                $scope.addedKhuyenMai = [];
            }
            $scope.kmDkSp = '';
            $scope.kmDkGtDh = '';
            $scope.kmDkSlSp = '';
            $scope.udCkPt = '';
            $scope.udQtSp = '';
            $scope.udQtDvt = '';
            $scope.udQtSlSp = '';
            $scope.udQtK = '';
            $scope.udCkT = '';
            $scope.isSubmit = false;

            // $scope.danhSachSanPhamPrim = [];
            // $scope.danhSachSanPham = [];
            // $scope.danhSachDonVi = [];

            //enable all
            $scope.haveValueCondition = false;
            $scope.haveProductCondition = false;

            $scope.disableQuatangSanpham = false;
            $scope.disableDiscountMoney = false;
            $scope.disableDiscountPercent = false;
            $scope.disableOtherGift = false;

            $(".selectpicker").change();
        }

        function selectLastUnit() {
            $http.get(config.base + '/products/getUnits').then(function (response) {
                $scope.danhSachDonVi = angular.copy(response.data);

                //cho quy cach co id lon nha
                $scope.udQtDvt = $scope.danhSachDonVi[$scope.danhSachDonVi.length - 1];
                window.location.reload();
                // $("#udQtDvt").change();
            });
        }
    }]);
