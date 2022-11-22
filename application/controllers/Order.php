<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Order extends MY_Controller
{

    const ORDER_IS_DELIVERY = 1;
    const ORDER_FINISHED = 5;
    const ORDER_NEW = 2;
    const ORDER_DELIVERED = 3;
//    public const ORDER_HAS_SHIPMENT = 2;
//    public const ORDER_HAS_SHIPMENT = 2;
    public function __construct()
    {
        parent::__construct();
        $this->load->model('customers_model', 'customers');
        $this->load->model('order_model', 'order');
    }

    public function index()
    {
        $order = $this->order->get_array(['status' => 2, 'delivery <>' => 1], true);
        $this->load->model('Order_detail_model', 'order_detail');
        $this->load->model('shipments_model', 'shipment');

        $colorList = [
            '#7643ff', // Blue violet
            '#0a5ffa', // blue
            '#1a8f7d', // blue green
            '#24b550', // green
            '#88e03c', // yellow green
            '#fef200', // yellow
            '#fccc00', // yellow orange
            '#fe8f01', // orange
            '#f95201', // red orange
            '#fe0000', // red
            '#ab31aa', // red violet
            '#7a1fa0', // violet
        ];

        $truckColorList = [
            1 => '#02a8ea', //Xanh-84269 blue
            2 => '#24b550', //Trang-28245 green
            3 => '#fef200', //XeNho-28187 yellow
        ];

        $shipmentIndexColorList = [
            '#e6b8af',
            '#dd7e6b',
            '#cc4125',
            '#a61c00',
        ];

        $listShipmentColor = [];
        foreach ($order as $key => &$row) {
            $total = $this->order_detail->count_total_quantity($row->id);
            $row->total_quantity = $total->count;
            if (!empty($row->shipment_id)) {
                $shipment = $this->shipment->getShipment($row->shipment_id);
                if (!empty($shipment)) {
                    if (isset($truckColorList[$shipment->truck_id])) {
                        $shipmentIndexColor = $shipment->index % count($shipmentIndexColorList) - 1;
                        if ($shipmentIndexColor < 0) $shipmentIndexColor = count($shipmentIndexColorList) - 1;
                        $row->colors = ['shipment' => $truckColorList[$shipment->truck_id], 'index' => $shipmentIndexColorList[$shipmentIndexColor]];
                    } else {
                        $row->colors = ['shipment' => '#ffffff', 'index' => '#ffffff'];
                    }
                    $row->shipmentTruck = $shipment->truck_name;
                    $row->shipmentIndex = $shipment->index;
                }
            }
        }


        echo json_encode(['orders' => $order]);
    }

    public function deleteOrder($order_id)
    {
        $this->load->model('order_detail_model', 'order_detail');
        $this->order->delete(['id' => $order_id]);
        $this->order_detail->delete(['order_id' => $order_id]);
    }

    public function updateQuantityOrder()
    {
        $data = $this->input->json();
        $this->load->model('order_detail_model', 'order_detail');

        foreach ($data as $key => $row) {
            $order_detail = $this->order_detail->get_by_id($row->order_id);
            $this->order_detail->update(['quantity' => $row->quantity, 'total' => ((int)$order_detail->price * (int)$row->quantity)], ['id' => $row->order_id]);
            $this->order->updatePriceOfOrder($order_detail->order_id);
        }
        echo json_encode(['status' => 'success']);
    }

    public function deleteProductInOrder($shipment_id, $product_id)
    {
        $this->load->model('order_detail_model', 'order_detail');
        $this->order_detail->delete_by_shipment($shipment_id, $product_id);
    }

    public function updateOrderDetail()
    {
        $data = $this->input->json();
        $orders = $data->order_detail;
        $order_id = $this->input->get('order_id');
        $this->load->model('order_detail_model', 'order_detail');
        #delete all order detail
        $this->order_detail->delete_by_order_id($order_id);

        #insert new order detail
        $total_order = 0;
        foreach ($orders as $key => $row) {
            $order_insert = ['order_id' => $order_id,
                'product_id' => $row->product_id,
                'quantity' => $row->quantity,
                'unit' => $row->unit,
                'cost' => $row->cost,
                'price' => $row->price,
                'total' => $row->total];
            $this->order_detail->insert($order_insert);
            $total_order += (int)$row->total;
        }

        #update total price of bill
        $this->order->update(['total_price' => $total_order, 'note' => $data->note], ['id' => $order_id]);
        echo json_encode('ok');
    }

    public function getInventory()
    {
        $unit_id = $this->input->get('unit');

        #load model
        $this->load->model('products_model', 'products');
        $this->load->model('products_sale_price_model', 'products_sale');
        $this->load->model('warehouse_retail_model', 'retail');
        $this->load->model('warehouse_wholesale_model', 'wholesale');
        $this->load->model('warehouses_detail_model', 'warehouses_detail');

        #get inventory
        $quantity = 0;
        $unit = $this->products_sale->get_by_id($unit_id);
        $total_unit = $this->products_sale->get_by_product_id($unit->product_id);

        if ($unit->parent_id == null && count($total_unit) > 0) {
            $warehouses_count = $this->warehouses_detail->count_product_all_warehouses($unit->product_id);

            $wholesale = $this->wholesale->get_by_product_id($unit->product_id);
            $warehouses_count->total ? $warehouses_count = (int)$warehouses_count->total : $warehouses_count = 0;
            count($wholesale) > 0 ? $wholesale = (int)$wholesale->quantity : $wholesale = 0;
            $quantity = $warehouses_count + $wholesale;
        } else {
            $retail = $this->retail->get_by_product_id($unit->product_id);
            count($retail) > 0 ? $retail = $retail->quantity : $retail = 0;
            $quantity = $retail;
        }
        $product_detail = $this->products->get_by_id($unit->product_id);
        $product_detail->inventory = $quantity;

        echo json_encode(['product_detail' => $product_detail, 'unit_detail' => $unit]);
    }

    public function addProductPopup()
    {
        $this->load->model('products_model', 'products');
        $this->load->model('products_sale_price_model', 'sale_price');
        $products = $this->products->get_all_order('order');
        $units = $this->sale_price->get_all();
        echo json_encode(['products' => $products, 'units' => $units]);
    }

    public function getProductOrder($shipment_id, $product_id)
    {
        $this->load->model('order_detail_model', 'order_detail');
        $orders = $this->order->get_array(['shipment_id' => $shipment_id]);
        $order_product = [];
        foreach ($orders as $key => &$row) {
            $order_detail = $this->order_detail->get_array(['order_id' => $row->id, 'product_id' => $product_id]);
            if (count($order_detail) > 0) {
                $row->customer_detail = $this->customers->get_by_id($row->customer_id);
                $row->order_detail = $order_detail[0];
                array_push($order_product, $row);
            }
        }
        echo json_encode(['orders' => $order_product]);
        die;
    }

    public function getOrder()
    {
        $order_id = $this->input->get('id');
        $this->load->model('bill_model', 'bill');
        $order = $this->order->get_by_id($order_id);
        $order->customer_detail = $this->customers->get_by_id($order->customer_id);
        $order->customer_detail->debit = $this->bill->get_customer_debit($order_id);

        #get product detail
        $this->load->model('products_model', 'products');
        $this->load->model('products_sale_price_model', 'products_sale');
        $this->load->model('warehouse_retail_model', 'retail');
        $this->load->model('warehouse_wholesale_model', 'wholesale');
        $this->load->model('warehouses_detail_model', 'warehouses_detail');

        foreach ($order->order_detail as $key => $row) {
            $order->order_detail[$key]->product_detail = $this->products->get_by_id($row->product_id);
            $order->order_detail[$key]->unit_detail = $this->products_sale->get_by_id($row->unit);
            $total_unit = $this->products_sale->get_by_product_id($row->product_id);

            if ($row->unit_detail->parent_id == null && count($total_unit) > 0) {
                $warehouses_count = $this->warehouses_detail->count_product_all_warehouses($row->product_id);
                $wholesale = $this->wholesale->get_by_product_id($row->product_id);
                $warehouses_count->total ? $warehouses_count = (int)$warehouses_count->total : $warehouses_count = 0;
                count($wholesale) > 0 ? $wholesale = (int)$wholesale->quantity : $wholesale = 0;
                $order->order_detail[$key]->product_detail->inventory = $warehouses_count + $wholesale;
            } else {
                $retail = $this->retail->get_by_product_id($row->product_id);
                count($retail) > 0 ? $retail = $retail->quantity : $retail = 0;
                $order->order_detail[$key]->product_detail->inventory = $retail;
            }
        }

        echo json_encode(['order' => $order]);

    }

    public function createOrder()
    {
        $type = $this->input->get('type');
        $customers = $this->customers->get_all_customer_by_type($type);
        $this->load->model('bill_model', 'bill');
        foreach ($customers as $key => $row) {
            $customers[$key]->total_debt = $this->bill->get_customer_debit($row->id);
        }
        #get products
        $this->load->model('products_model');
        $products = $this->products_model->get_all_order('order');
        $this->load->model('ProductUnitModel', 'ProductUnit');
        $units = $this->ProductUnit->getListReturnArray(['is_deleted' => 0]);

        $unitIds = array_column($units, 'id');
        array_combine($unitIds, $units);

        foreach ($products as $key => $product) {
            if (isset($units[$product->sale_unit]) and $units[$product->sale_unit]['is_prefix'] == 1) {
                $products[$key]->name = "{$units[$product->sale_unit]['name']} {$products[$key]->name}";
            }
        }

        #get unit
        $this->load->model('products_sale_price_model', 'products_sale');
        $unit = $this->products_sale->get_all();
        echo json_encode(['customers' => $customers, 'products' => $products, 'units' => $unit]);
    }

    public function addOrder()
    {

        echo $this->createNewOrder();
    }

    private function createNewOrder()
    {
        $order = $this->input->json();

        $order_details = [];
        foreach ($order->orders as $key => $row) {
            if (isset($order_details[$row->product_id])) {
                $order_details[$row->product_id]->quantity += $row->quantity;
            } else {
                $order_details[$row->product_id] = $row;
            }
        }

        $this->load->model('order_detail_model', 'order_detail');
        $order_id = $this->order->insert(['customer_id' => $order->customer_id,
            'total_price' => $order->total_price,
            'note' => $order->note,
            'saler' => $order->saler]);
        $order_code = $this->convertBillCode($order_id, 'CH');
        $this->order->update(['order_code' => $order_code], ['id' => $order_id]);
        foreach ($order_details as $key => $row) {
            $this->load->model('products_buy_price_model', 'products_buy');
            $cost = $this->products_buy->get_old_product($row->product_id, 'wholesale');
            if ($cost)
                $row->cost = $cost->id;
            $row->order_id = $order_id;
            $this->order_detail->insert($row);
        }
        //store promotion
        $this->order->__set('table_name', 'order_promotion');
        foreach ($order->lstProId as $pro) {
            $this->order->insert(['order_id' => $order_id, 'promotion_id' => $pro->id, 'quantity' => $pro->quantity]);
        }

        return $order_id;
    }

    public function managementOrder()
    {
        $this->checkAllowAccess(ROLE_ADMIN);
        $this->load->model('trucks_model', 'trucks');
        $this->load->model('staff_model', 'staff');
        $this->order->table_name = 'order_view';
        $orders = $this->order->get_all();
        foreach ($orders as &$order) {
            $order->total_box = $this->countNumberOfBox($order->id);
        }
        $trucks = $this->trucks->get_array(['active' => 0]);
        $staffs = $this->staff->get_array(['active' => 0]);
        echo json_encode(['orders' => $orders, 'trucks' => $trucks, 'staffs' => $staffs]);
    }

    public function createShipment()
    {
        $this->checkAllowAccess(ROLE_ADMIN);
        $data = $this->input->json();
        $shipment = $data->order;
        $shipment_id = $data->id;
        $truck = $data->truck;
        $this->load->model('shipments_model', 'shipment');

        if (!$shipment_id) {
            $date = date('Y-m-d', strtotime($data->date));
            $data_insert = ['truck_id' => $truck,
                'driver' => 0,
                'sub_driver' => 0,
                'date' => $data->date,
                'index' => $data->index
            ];
            $shipment_id = $this->shipment->insert($data_insert);
        } else {
            $this->order->removeShipment($shipment_id);
        }
        foreach ($shipment as $key => $row) {
            if ($row->status == 5)
                $this->shipment->update(['status' => '3'], ['id' => $row->shipment_id]);
            $this->order->update(['shipment_id' => $shipment_id], ['id' => $row->id]);
        }
        echo json_encode(['shipment_id' => $shipment_id]);
    }

    public function divideOrder()
    {
        $this->checkAllowAccess(ROLE_ADMIN);
        $shipment_id = $this->input->get('shipment_id');
        $this->load->model('order_detail_model', 'order_detail');
        $this->load->model('warehouses_detail_model', 'warehouses_detail');
        $this->load->model('warehouse_wholesale_model', 'warehouse_wholesale');
        $this->load->model('shipments_model');
        $this->load->model('products_sale_price_model', 'sale_price');
        $this->load->library('convert_unit');
        $this->load->model('warehouse_retail_model', 'warehouse_retail');
        $this->load->model('customers_model', 'customers');
        $this->order_detail->__set('table_name', 'order_detail_view');

        $shipment = $this->shipments_model->get_by_id($shipment_id);
        $shipment->sub_driver = explode(",", $shipment->sub_driver);

        $other_shipments = $this->shipments_model->getAllUndeliver();
        #get orders
        $orders = $this->order->get_array(['shipment_id' => $shipment_id]);
        $product_group = [];

        #get all warehouse
        $this->load->model("warehouses_model", 'warehouses');
        $this->load->model("warehouses_detail_model", 'warehouses_detail');
        $this->load->model("warehouse_wholesale_model", 'warehouse_wholesale');
        $warehouses = $this->warehouses->get_array(['is_active' => "0"]);
        $wholesale = (object)['id' => 0, 'name' => 'Kho nhà'];
        array_unshift($warehouses, $wholesale);

        #get all order by shipment and group product by product id
        $total_quantity = ['detail' => [], 'product_name' => 'Tổng']; //this variable declare total of quantity for each order
        foreach ($orders as $key => $row) {
            $orders[$key]->customer_detail = $this->customers->get_by_id($row->customer_id);
            $orders[$key]->order_detail = $this->order_detail->get_order_detail($row->id);
            foreach ($row->order_detail as $index => $item) {
                if (isset($total_quantity['detail'][$item->order_id]))
                    $total_quantity['detail'][$item->order_id] += (int)$item->quantity;
                else
                    $total_quantity['detail'][$item->order_id] = (int)$item->quantity;

                if (isset($product_group[$item->product_id]))
                    array_push($product_group[$item->product_id], $item);
                else
                    $product_group[$item->product_id] = [$item];
                $orders[$key]->order_detail[$index]->preQuantity = $item->quantity;
            }
        }

        usort($product_group, function ($a, $b) {
            return $a[0]->index > $b[0]->index;
        });

        //Get promotion
        $this->load->model('PromotionDetail', 'Promotion');
        $this->Promotion->__set('table_name', 'promotion_order_view');
        $lisPromotion = [];
        $this->load->model('ProductUnitModel');
        foreach ($orders as $order) {
            $promotions = $this->Promotion->get_array(['order_id' => $order->id]);
            foreach ($promotions as $promo) {
                $proUnit = $this->ProductUnitModel->get_by_id($promo->product_gift_unit);
                if ($promo->product_gift) {
                    if (isset ($lisPromotion[$promo->product_gift][$promo->product_gift_unit])) {
                        $lisPromotion[$promo->product_gift][$promo->product_gift_unit]->quantity += $promo->quantity;
                    } else {
                        $newProdUnit = new StdClass();
                        $newProdUnit->quantity = $promo->quantity;
                        $newProdUnit->unit = $proUnit->name;
                        $lisPromotion[$promo->product_gift][$promo->product_gift_unit] = $newProdUnit;
                    }

                }
            }
        }

        $this->load->model('Products_model', 'Product');
        $this->load->model('Products_type_model', 'ProductType');
        #repare array product for each other in view
        $list_product = [];
        $total_quantity['total_quantity'] = 0;
        foreach ($product_group as $index => $row) {
            $list = [];
            foreach ($orders as $key => $value) {
                $list['detail'][$value->id] = [];
                $list['total_quantity'] = 0;
                foreach ($row as $item => $prod) {
                    $list['product_name'] = $prod->product_name;
                    $list['total_quantity'] += (int)$prod->quantity;
                    $list['product_id'] = $prod->product_id;
                    if ($prod->order_id == $value->id)
                        $list['detail'][$value->id] = $prod->quantity;
                    if (is_array($list['detail'][$value->id]))
                        $list['detail'][$value->id] = '';
                    $inventory = $this->warehouse_wholesale->getInventoryById($prod->product_id);
                    $inventory = $inventory ? $inventory->quantity : 0;

                    $trathuong = $this->warehouse_wholesale->getTotalInventoryOfAlias($prod->product_id);
                    $trathuong = $trathuong ? $trathuong->quantity : 0;
                    $list['inventory'] = $inventory + $trathuong;
                    if (isset($lisPromotion[$prod->product_id])) {
                        $promotionDetails = [];
                        foreach( $lisPromotion[$prod->product_id] as $promotion) {
                            $promotionDetails[] = "{$promotion->quantity} {$promotion->unit}";
                        }
                        $list['promotion'] = implode(" + ", $promotionDetails);
                        unset($lisPromotion[$prod->product_id]);
                    }
                    $currentPro = (array)$this->Product->getSingle($prod->product_id);
                    $type = (array)$this->ProductType->get_by_id($currentPro['product_type']);
                    if (isset($type['name'])) {
                        $list['type'] = $type['name'];
                    }
                }
            }
            $total_quantity['total_quantity'] += $list['total_quantity'];
            array_push($list_product, $list);
        }

        foreach ($lisPromotion as $prodid => $promo) {
            $inventory = $this->warehouse_wholesale->getInventoryById($prodid);
            $inventory = $inventory ? $inventory->quantity : 0;
            $trathuong = $this->warehouse_wholesale->getTotalInventoryOfAlias($prodid);
            $trathuong = $trathuong ? $trathuong->quantity : 0;
            $product = $this->Product->get_by_id($prodid);
            if ($product->product_type) {
                $type = (array)$this->ProductType->get_by_id($product->product_type->id);
            } else {
                $type = ['name' => ''];
            }

            $promotionDetails = [];
            foreach( $promo as $promotion) {
                $promotionDetails[] = "{$promotion->quantity} {$promotion->unit}";
            }

            $list = array(
                'product_name' => $product->name,
                'detail' => [],
                'total_quantity' => 0,
                'product_id' => $prodid,
                'inventory' => $inventory + $trathuong,
                'promotion' => implode(" + ", $promotionDetails),
                'type' => $type['name']
            );

            array_push($list_product, $list);
        }

        usort($list_product, function ($a, $b) {
            if (!isset($a['type'])) return -1;
            if (!isset($b['type'])) return 1;
            return ($a['type'] == $b['type']) ? $a['product_name'] > $b['product_name'] : $a['type'] > $b['type'];
        });
        $list_product = ['summary' => $total_quantity, 'detail' => $list_product];

        #get information of truck and staff
        $this->load->model('trucks_model', 'trucks');
        $this->load->model('staff_model', 'staff');
        $trucks = $this->trucks->get_array(['active' => 0]);
        $staffs = $this->staff->get_array(['active' => 0]);

        echo json_encode(['orderList' => $orders,
            'productList' => $list_product,
            'warehouses' => $warehouses,
            'shipment_id' => $shipment_id,
            'trucks' => $trucks,
            'shipment' => $shipment,
            'other_shipment' => $other_shipments,
            'staffs' => $staffs]);
    }

    public function updateWarehouse()
    {
        $shipment = $this->input->json();
        $ship_id = $this->input->get('ship_id');

        $this->load->model('shipments_model');
        $shipment->sub_driver = empty($shipment->sub_driver) ? "" : implode(",", $shipment->sub_driver);
        $this->shipments_model->update($shipment, ['id' => $ship_id]);
        echo json_encode($shipment);
    }

    public function statusOrder()
    {
        $this->load->model('shipments_model', 'shipment');
        $this->shipment->__set('table_name', 'shipment_view');
        $shipments = $this->shipment->get_array(['status !=' => '3']);
        $shipments = array_filter($shipments, function ($value) {
            return count($value->orders) > 0;
        });
        $this->load->model('PromotionDetail', 'Promotion');
        $this->Promotion->__set('table_name', 'promotion_order_view');
        $this->load->model('Debits_model', 'Debit');
        foreach ($shipments as &$shipment) {
            foreach ($shipment->orders as $key => &$order) {
                $promotions = $this->Promotion->get_array(['order_id' => $order->id]);
                $totalPromotionValue = 0;

                foreach ($promotions as $pro) {
                    if ($pro->money_discount) {
                        $totalPromotionValue += $pro->quantity * $pro->money_discount;
                    } elseif ($pro->percent_discount) {
                        $totalPromotionValue += $order->total_price / 100 * $pro->percent_discount;
                    }
                }
                $order->totalPromotionValue = $totalPromotionValue;
                $currentDebit = $this->Debit->get_customer_total_debit($order->customer_id);
                $order->currentDebit = $currentDebit ? $currentDebit->total_debit : 0;
                $order->debit = 0;
                $order->isProcessing = false;
            }
        }
        echo json_encode(['shipments' => array_values($shipments)]);
    }

    public function updateStatusShipment()
    {
        $shipment_id = $this->input->get('shipment_id');
        $status = $this->input->get('status');
        $debitdata = $this->input->json();
        $this->load->model('order_model', 'order');
        $this->load->model('shipments_model', 'shipments');
        $shipment = $this->shipments->get_by_id($shipment_id);
        $lastIndex = $shipment->index;
        $shipmentDate = $shipment->date;

        $this->db->trans_start();
        $error = [];
        if ($status == 1) {
            //Get promotions
            $this->load->model('ProductUnitModel');
            $this->load->model('PromotionDetail', 'Promotion');
            $this->load->model('Products_model');
            $this->Promotion->__set('table_name', 'promotion_order_view');

            $listPromotionProduct = [];

            $promotionProductQuantity = [];

            $lstOrder = $this->order->getByShipment($shipment_id);
            foreach ($lstOrder as $order) {
                $promotions = $this->Promotion->get_array(['order_id' => $order['id']]);
                foreach ($promotions as $pro) {
                    if ($pro->product_gift) {
                        $rate = $this->ProductUnitModel->getConvertRate($pro->product_gift, $pro->product_gift_unit);
                        if (empty($rate) || $rate->quantity <= 0) {
                            $tempPro = $this->Products_model->get_by_id($pro->product_gift);
                            $error[] = "Không tìm thấy quy đổi đơn vị của khuyến mãi - sản phẩm {$tempPro->name}";
                            break;
                        }
                        if (isset($listPromotionProduct[$order['id']]) && isset($listPromotionProduct[$order['id']][$pro->product_gift])) {
                            $listPromotionProduct[$order['id']][$pro->product_gift]['productQuantity'] += $pro->quantity * $pro->product_gift_no;
                        } else {
                            $listPromotionProduct[$order['id']][$pro->product_gift] = [
                                'productId' => $pro->product_gift,
                                'productQuantity' => $pro->quantity * $pro->product_gift_no,
                                'unit' => $pro->product_gift_unit,
                                'rate' => $rate->quantity,
                            ];
                        }

                        if (isset($promotionProductQuantity[$pro->product_gift])) {
                            $promotionProductQuantity[$pro->product_gift]['productQuantity'] += $pro->quantity * $pro->product_gift_no;
                        } else {
                            $promotionProductQuantity[$pro->product_gift] = ['productQuantity' => $pro->quantity * $pro->product_gift_no, 'rate' => $rate->quantity];
                        }
                    }
                }
            }

            if (!empty($error)) {
                $errorMessage = implode("<br />", $error);
                echo json_encode(['result' => 0, 'error' => $errorMessage]);
                exit;
            }

            //update warehouse
            $this->load->model('warehouse_wholesale_model', 'wholesale');
            $order_products = $this->wholesale->getOrdersByshipment($shipment_id);
            if (count($order_products) > 0) {
                $order_products = array_column($order_products, 'total_quantity', 'product_id');
                $ids = array_keys($order_products);
                $current_inventories = $this->wholesale->getInventoryByIds($ids);
                $keys = array_column($current_inventories, 'product_id');
                $current_inventories = array_combine($keys, $current_inventories);

                foreach ($current_inventories as $product => $inventory) {
                    $trathuong = $this->wholesale->getTotalInventoryOfAlias($product);
                    if ($trathuong) {
                        $current_inventories[$product]['quantity'] += $trathuong->quantity;
                    }
                }
                $allowExport = true;
                $error = [];
                foreach ($order_products as $productId => $order_quantity) {
                    if (!isset($current_inventories[$productId])) {
                        $tempPro = $this->Products_model->get_by_id($productId);
                        $error[] = "Không tìm thấy tồn kho sản phẩm {$tempPro->name}. Sản phẩm có thể đã bị xóa hoặc chưa được nhập hàng.";
                        $allowExport = false;
                    } else {
                        $totalOrderQuan = (int)$order_quantity;
                        if (isset($promotionProductQuantity[$productId])) {
                            $totalOrderQuan += $promotionProductQuantity[$productId]['productQuantity'] / $promotionProductQuantity[$productId]['rate'];
                        }
                        if ((int)$current_inventories[$productId]['quantity'] < $totalOrderQuan) {
                            $error[] = "Không đủ tồn kho của {$current_inventories[$productId]['name']}.";
                            $allowExport = false;
                        }
                    }
                }
                if (!$allowExport) {
                    $errorMessage = implode("<br />", $error);
                    echo json_encode(['result' => 0, 'error' => $errorMessage]);
                    exit;
                }
            }
            foreach ($debitdata as $data) {
                $this->order->update(['old_debit' => $data->debit], ['id' => $data->id]);
                $order = $this->order->get_by_id($data->id);
                $this->createPaidBillByOrder($order);
            }

            //update inventory
            $orders = $this->order->getByShipment($shipment_id);
            $this->load->model('order_detail_model', 'order_detail');
            foreach ($orders as $order) {
                $order_detail = $this->order_detail->get_order_detail($order['id']);
                foreach ($order_detail as $product) {
                    $inventories = $this->updateInventoryForSale($product->product_id, $product->quantity);
                    foreach ($inventories as $inv) {
                        $inv['order_id'] = $order['id'];
                        $this->order->addSaleInventory($inv);
                    }
                }
            }

            //inventory of promotion
            $this->load->model('Warehouses_model');
            foreach ($listPromotionProduct as $orderId => $promotionProduct) {
                foreach ($promotionProduct as $product) {
                    $quantity = floor($product['productQuantity'] / $product['rate']);
                    $odd = $product['productQuantity'] % $product['rate'];
                    if ($odd) {
                        $oddInv = $this->Warehouses_model->getOddInventory($product['productId']);
                        $oddQuantity = 0;
                        if (!$oddInv) {
                            $quantity += 1;
                            $insertdata = array(
                                'quantity' => $product['rate'] - $odd,
                                'product_id' => $product['productId'],
                                'unit' => $product['unit']
                            );
                            $this->db->insert('warehouse_odd_product', $insertdata);
                        } elseif ($oddInv->quantity < $odd) {
                            $oddQuantity = $oddInv->quantity + $product['rate'] - $odd;
                            $quantity += 1;
                            $this->Warehouses_model->updateOddInventory($product['productId'], $oddQuantity);
                        } else {
                            $oddQuantity = $oddInv->quantity - $odd;
                            $this->Warehouses_model->updateOddInventory($product['productId'], $oddQuantity);
                        }
                    }

                    $inventories = $this->updateInventoryForSale($product['productId'], $quantity);
                    foreach ($inventories as $inv) {
                        $inv['order_id'] = $orderId;
                        $inv['is_promotion'] = 1;
                        $this->order->addSaleInventory($inv);
                    }
                    if ($odd) {
                        $inv = end($inventories);
                        $inv['quantity'] = $odd;
                        $inv['promotion_unit'] = $product['unit'];
                        $inv['is_promotion'] = 1;
                        $inv['order_id'] = $orderId;
                        $this->order->addSaleInventory($inv);
                    }
                }
            }

            $this->order->updateLastBillId($shipment_id);
            $shipmentDate = date('Y-m-d 00:00:00');
            $lastIndexObj = $this->shipments->getShipmentLastIndexByTruckAndDate($shipment->truck_id, $shipmentDate, 1);
            $lastIndex = $lastIndexObj->index + 1;
        }

        #update shipment

        $this->shipments->update(['status' => "$status", 'index' => $lastIndex, 'date' => $shipmentDate], ['id' => $shipment_id]);

        #update order
        $this->order->update(['status' => 1], ['shipment_id' => $shipment_id]);

        $this->db->trans_complete();
        echo json_encode(['result' => 1, 'error' => '']);
    }

    private function updateInventoryForSale($productId, $saleQuantity)
    {
        $allInventories = $this->wholesale->getAllInventoryOfProduct($productId);
        $alias = $this->wholesale->getInventoryByAlias($productId);
        $allInventories = array_merge($allInventories, $alias);
        $result = [];
        foreach ($allInventories as $inventory) {
            if ($inventory->quantity >= $saleQuantity) {
                $newQuant = $inventory->quantity - $saleQuantity;
                $processed = $newQuant > 0 ? 0 : 1;
                $this->wholesale->update(['quantity' => $newQuant, 'processed' => $processed], ['id' => $inventory->id]);
                $result[] = ['quantity' => $saleQuantity, 'buy_price' => $inventory->price, 'inventory_id' => $inventory->id, 'product_id' => $inventory->product_id];
                break;
            } else {
                $this->wholesale->update(['quantity' => 0, 'processed' => 1], ['id' => $inventory->id]);
                $saleQuantity -= $inventory->quantity;
                $result[] = ['quantity' => $inventory->quantity, 'buy_price' => $inventory->price, 'inventory_id' => $inventory->id, 'product_id' => $inventory->product_id];
            }
            if ($saleQuantity <= 0) {
                break;
            }
        }
        return $result;
    }

    public function updateOrder()
    {
        $order_id = $this->input->get('order_id');
        $this->order->update(['status' => 5], ['id' => $order_id]);
        echo json_encode($order_id);
    }

    public function returnWarehouse( $data = null)
    {
        if (empty($data)) {
            $data = $this->input->json();
        }
        $order_id = $data->order_id;
        $this->load->model('order_model', 'order');
        $this->load->model('warehouse_wholesale_model', 'wholesale');
        $this->load->model('order_detail_model', 'order_detail');
        $order = $this->order->get_by_id($order_id);

        if ($order->delivery == 1 or $order->status != 1) {
            echo json_encode(['error' => 'Không thể xử lý đơn hàng này']);
            exit;
        }

        $this->load->model('PromotionDetail', 'Promotion');
        $this->Promotion->__set('table_name', 'promotion_order_view');
        $this->load->model('Debits_model', 'Debit');
        $promotions = $this->Promotion->get_array(['order_id' => $order->id]);
        $totalPromotionValue = 0;

        foreach ($promotions as $pro) {
            if ($pro->money_discount) {
                $totalPromotionValue += $pro->quantity * $pro->money_discount;
            } elseif ($pro->percent_discount) {
                $totalPromotionValue += $order->total_price / 100 * $pro->percent_discount;
            }
        }
        //create bill
        $data_inset = array(
            'partner' => $order->customer_id,
            'total_bill' => 0,
            'debt' => $order->old_debit,
            'note' => implode("\n", array_filter( [$order->note, '[Trả về kho] ' . $data->note])),
            'shipment_id' => $order->shipment_id,
            'ignor_statistic' => 1,
            'bill_inv' => [],
            'old_debit' => $order->old_debit,
            'saler' => $order->saler
        );

        #init array for order detail
        foreach ($order->order_detail as $key => $row) {
            $data_inset['buy_price'][] = (object)array('product_id' => $row->product_id,
                'quantity' => 0,
                'returned' => $row->quantity,
                'price' => $row->price);
        }
        $bill_id = $this->createBill((object)$data_inset);
        //end create bill

        $this->order->update(['delivery' => '1', 'status' => '4'], ['id' => $order_id]);
        $shipment = $this->order->get_array(['shipment_id' => $order->shipment_id, 'delivery' => '0']);
        if (count($shipment) == 0) {
            $this->load->model('shipments_model');
            $this->shipments_model->update(['status' => '3'], ['id' => $order->shipment_id]);
        }
        $orderInventories = $this->order->getSaleInventory($order_id);
        foreach ($orderInventories as $key => $row) {
            $this->wholesale->ajustInventory($row->inventory_id, $row->quantity);
        }
        $this->rollbackPromotionInventory($order_id);
    }

    public function returnHalfWarehouse()
    {
        $this->checkAllowAccess(ROLE_ADMIN);
        $order_id = $this->input->get('order_id');
        $this->load->model('Warehouses_model', 'Warehouse');
        $this->load->model('order_model', 'order');

        $order = $this->order->get_by_id($order_id);
        $currentDebit = $order->old_debit;
        if ($order->delivery == 1 or $order->status > 2) {
            echo json_encode(['error' => 'Không thể xử lý đơn hàng này']);
            exit;
        }

        $this->load->model('order_detail_model', 'order_detail');
        $this->load->model('products_sale_price_model', 'sale_price');
        $orderdetail = $this->order_detail->get_order_detail($order_id);

        foreach ($orderdetail as $key => $row) {
            $orderdetail[$key]->received = $row->quantity;
            $orderdetail[$key]->inventory = $this->Warehouse->getInventory($row->product_id);
        }

        list($totalPromotionValue, $promotionProducts) = $this->getOrderPromotions($order_id);

        $order = new stdClass();
        $order->detail = $orderdetail;
        $order->totalPromotionValue = $totalPromotionValue;
        $order->promotionProducts = array_values($promotionProducts);
        $order->currentDebit = $currentDebit ? $currentDebit : 0;
        echo json_encode($order);
    }

    private function getOrderPromotions($orderID)
    {
        $this->load->model('Warehouses_model', 'Warehouse');
        $this->load->model('order_detail_model', 'order_detail');
        $this->load->model('products_sale_price_model', 'sale_price');
        $this->load->model('PromotionDetail', 'Promotion');
        $this->Promotion->__set('table_name', 'promotion_order_view');
        $this->load->model('Debits_model', 'Debit');

        $orderDetail = $this->order_detail->get_order_detail($orderID);
        $totalAmount = 0;
        foreach ($orderDetail as $key => $row) {
            $orderDetail[$key]->received = $row->quantity;
            $orderDetail[$key]->inventory = $this->Warehouse->getInventory($row->product_id);
            $totalAmount += $row->price * $row->quantity;

        }
        $promotions = $this->Promotion->get_array(['order_id' => $orderID]);
        $totalPromotionValue = 0;

        $promotionProducts = [];
        $this->load->model('Products_model');
        $this->load->model('ProductUnitModel');
        foreach ($promotions as $pro) {
            if ($pro->money_discount) {
                $totalPromotionValue += $pro->quantity * $pro->money_discount;
            } elseif ($pro->percent_discount) {
                $totalPromotionValue += $totalAmount / 100 * $pro->percent_discount;
            } elseif ($pro->product_gift) {
                if (isset($promotionProducts[$pro->product_gift])) {
                    $promotionProducts[$pro->product_gift]['quantity'] += $pro->quantity;
                } else {
                    $currentProduct = $this->Products_model->get_by_id($pro->product_gift);
                    $currentUnit = $this->ProductUnitModel->get_by_id($pro->product_gift_unit);
                    $promotionProducts[$pro->product_gift] = [
                        'quantity' => $pro->quantity,
                        'name' => $currentProduct->name,
                        'unit' => $currentUnit->name,
                        'unit_id' => $pro->product_gift_unit,
                        'product_id' => $pro->product_gift,
                    ];
                }
            }
        }

        return [$totalPromotionValue, $promotionProducts];
    }

    public function getRestOrder()
    {
        $truck_id = $this->input->get('truck_id');
        $orders = $this->order->getRestOrder($truck_id);
        echo json_encode(['orders' => $orders]);
    }

    public function processReturnHalfWarehouse( $data )
    {

        if (empty($data)) {
            $data = $this->input->json();
        }

        $order_id = empty($data->order_id) ? $this->input->get('order_id') : $data->order_id;
        $order = $this->order->get_by_id($order_id);
        if ($order->delivery == 1 or $order->status != 1) {
            echo json_encode(['error' => 'Không thể xử lý đơn hàng này']);
            exit;
        }
        $this->load->model('warehouses_detail_model', 'warehouses_detail');
        $this->load->model('warehouse_retail_model', 'warehouse_retail');
        $this->load->model('bill_model', 'bill');
        $this->load->model('bill_detail_model', 'bill_detail');
        $this->load->model('warehouse_wholesale_model', 'wholesale');

        $products = $data->product;

        #return warehouse whole
        $orderInventories = $this->order->getSaleInventory($order_id);
        $billInventories = $orderInventories;
        $this->load->model('order_detail_model', 'order_detail');
        foreach ($products as $row) {
            $returnQuan = $row->quantity - $row->received;
            if ($returnQuan > 0) {
                $this->order_detail->update(['returned' => $returnQuan], ['id' => $row->id]);
                foreach ($orderInventories as $key => $inv) {
                    if ($inv->product_id == $row->product_id) {
                        $ajustQuan = $inv->quantity > $returnQuan ? $returnQuan : $inv->quantity;
                        $returnQuan = $returnQuan - $ajustQuan;
                        $billInventories[$key]->quantity -= $ajustQuan;
                        $this->wholesale->ajustInventory($inv->inventory_id, $ajustQuan);
                        if ($returnQuan <= 0) {
                            break;
                        }
                    }
                }
            }
        }

        $billInventories = array_filter($billInventories, function ($value) {
            return $value->quantity > 0;
        });
        //create bill
        $this->load->model('order_model', 'order');

        $dataPromotions = [];
        $promotionInventories = $this->order->getSaleInventory($order_id, 1);
        $billPromotionInventories = [];
        list($totalPromotionValue, $originalPromotionProducts) = $this->getOrderPromotions($order_id);
        if (!$data->promotionProducts) {
            $this->rollbackPromotionInventory($order_id);
        } else {
            $this->load->model('PromotionDetail', 'Promotion');
            $this->Promotion->__set('table_name', 'promotion_order_view');
            foreach ($data->promotionProducts as $promotionProduct) {
                $temp = array(
                    'product_gift' => $promotionProduct->product_id,
                    'product_gift_no' => $promotionProduct->quantity,
                    'product_gift_unit' => $promotionProduct->unit_id,
                );
                $dataPromotions[] = $temp;

                $originalPromotionProducts[$promotionProduct->product_id]['quantity'] -= $promotionProduct->quantity;

                $promotionCheckQuan = $promotionProduct->quantity;
                foreach ($promotionInventories as $key => $inv) {
                    if ($inv->product_id == $promotionProduct->product_id && $inv->promotion_unit == $promotionProduct->unit_id) {
                        $inv->quantity = $inv->quantity > $promotionCheckQuan ? $promotionCheckQuan : $inv->quantity;
                        $promotionCheckQuan = $promotionCheckQuan - $inv->quantity;
                        $billPromotionInventories[] = $inv;

                        if ($promotionCheckQuan <= 0) {
                            break;
                        }
                    }
                }
            }
        }

        $billInventories = array_merge(array_values($billInventories), $billPromotionInventories);

        foreach ($originalPromotionProducts as $originalPromo) {
            $this->updateInventory($originalPromo['product_id'], $originalPromo['quantity'], $originalPromo['unit_id']);
        }

        if ($data->promotionMoney) {
            $dataPromotions[] = [
                'money_discount' => $data->promotionMoney,
                'money_value' => $data->promotionMoney
            ];
        }

        if ($order->old_debit > 0) {
            $this->payDebit($order->customer_id, $order->old_debit);
        }


        $data_inset = array(
            'partner' => $order->customer_id,
            'total_bill' => $data->price,
            'debt' => $data->debit,
            'note' => implode("\n", array_filter([$order->note, '[Lấy một phần]' . $data->reason])),
            'shipment_id' => $order->shipment_id,
            'bill_inv' => $billInventories,
            'old_debit' => $order->old_debit,
            'saler' => $order->saler
        );

        #init array for order detail
        foreach ($products as $key => $row) {
            $data_inset['buy_price'][] = (object)array(
                'product_id' => $row->product_id,
                'quantity' => $row->received,
                'returned' => $row->quantity - $row->received,
                'price' => $row->price);
        }
        $bill_id = $this->createBill((object)$data_inset);

        $this->Promotion->__set('table_name', 'bill_promotion');
        foreach ($dataPromotions as $billPromotion) {
            $billPromotion['bill_id'] = $bill_id;
            $this->Promotion->insert($billPromotion);
        }
        //end create bill

        $this->order->update(['delivery' => '1', 'status' => '6'], ['id' => $order_id]);
        $shipment = $this->order->get_array(['shipment_id' => $data->shipment_id, 'delivery' => '0']);
        if (count($shipment) == 0) {
            $this->load->model('shipments_model');
            $this->shipments_model->update(['status' => '3'], ['id' => $data->shipment_id]);
        }

        echo json_encode(['success' => true]);

    }

    private function rollbackPromotionInventory($orderId)
    {
        $this->load->model('ProductUnitModel');
        $orderInventories = $this->order->getSaleInventory($orderId, '1');
        foreach ($orderInventories as $key => $row) {
            if (!$row->promotion_unit) {
                $this->wholesale->ajustInventory($row->inventory_id, $row->quantity);
            } else {
                $this->load->model('Warehouses_model');
                $oddInv = $this->Warehouses_model->getOddInventory($row->product_id);
                if (!$oddInv) {
                    $insertdata = array(
                        'quantity' => $row->quantity,
                        'product_id' => $row->product_id,
                        'unit' => $row->promotion_unit
                    );
                    $this->db->insert('warehouse_odd_product', $insertdata);
                } else {
                    $rate = $this->ProductUnitModel->getConvertRate($row->product_id, $row->promotion_unit);
                    $rate = $rate ? $rate->quantity : 1;
                    $newOldQuan = $row->quantity + $oddInv->quantity;
                    if ($row->quantity + $oddInv->quantity > $rate) {
                        $this->wholesale->ajustInventory($row->inventory_id, floor($newOldQuan / $rate));
                        $newOldQuan = $newOldQuan % $rate;
                    }
                    $this->Warehouses_model->updateOddInventory($row->product_id, $newOldQuan);
                }
            }
        }
    }

    private function updateInventory($proId, $adjustQuantity, $unit)
    {
        if ($this->isProductPrimaryUnit($proId, $unit)) {
            $this->adjustPrimaryProduct($proId, $adjustQuantity);
        } else {
            $this->adjustOddProduct($proId, $adjustQuantity, $unit);
        }
    }

    private function adjustPrimaryProduct($productId, $adjustQuantity)
    {
        $inventory = $this->wholesale->getFirstInventory($productId);
        if ($adjustQuantity > 0) {
            $this->wholesale->ajustInventory($inventory->id, $adjustQuantity);
        } else {
            while ($adjustQuantity < 0) {
                $tempAdjust = $inventory->quantity + $adjustQuantity > 0 ? $adjustQuantity : -$inventory->quantity;
                $adjustQuantity -= $tempAdjust;
                $this->wholesale->ajustInventory($inventory->id, $tempAdjust);
                $inventory = $this->wholesale->getFirstInventory($productId);
            }
        }
    }

    private function adjustOddProduct($proId, $adjustQuantity, $unit)
    {
        $this->load->model('Warehouses_model');
        $oddInv = $this->Warehouses_model->getOddInventory($proId);
//        $rateObj = $this->ProductUnitModel->getConvertRate($proId, $unit);
        $rate = $this->getProductConvertQuantity($proId, $unit);
        if ($adjustQuantity > 0) {
            if (!$oddInv) {
                $primaryProQuantity = floor($adjustQuantity / $rate);
                $adjustQuantity -= (int)$primaryProQuantity * $rate;
                $insertdata = array(
                    'quantity' => $adjustQuantity,
                    'product_id' => $proId,
                    'unit' => $unit
                );
                $this->db->insert('warehouse_odd_product', $insertdata);
                if ($primaryProQuantity > 0) {
                    $this->adjustPrimaryProduct($proId, $primaryProQuantity);
                }
            } else {
                $newOddQuan = $adjustQuantity + $oddInv->quantity;
                if ($newOddQuan > $rate) {
                    $primaryProQuantity = floor($newOddQuan / $rate);
                    $newOddQuan = $newOddQuan % $rate;
                    $this->adjustPrimaryProduct($proId, $primaryProQuantity);
                }
                $this->Warehouses_model->updateOddInventory($proId, $newOddQuan);
            }
        } elseif ($adjustQuantity < 0) {
            if ($oddInv) {
                $adjustQuantity += $oddInv->quantity;
            }

            if ($adjustQuantity < 0) {
                $primaryProQuantity = floor(abs($adjustQuantity) / $rate);
                $adjustQuantity += $primaryProQuantity * $rate;
                if ($adjustQuantity < 0) {
                    $primaryProQuantity += 1;
                    $adjustQuantity += $rate;
                }
                if ($primaryProQuantity != 0) {
                    $this->adjustPrimaryProduct($proId, -$primaryProQuantity);
                }
            }
            $this->Warehouses_model->updateOddInventory($proId, $adjustQuantity);
        }
    }

    private function getProductConvertQuantity($productId, $unit)
    {
        $this->load->model('ProductUnitModel');
        $rate = $this->ProductUnitModel->getConvertRate($productId, $unit);
        return $rate ? $rate->quantity : 1;
    }

    private function isProductPrimaryUnit($proId, $unit)
    {
        return $this->getProductConvertQuantity($proId, $unit) == 1;
    }

    protected function orderDelivered($data = null)
    {
        $this->load->model('order_model', 'order');
        $order = $this->order->get_by_id($data->order_id);
        if ($order->delivery == 1 or $order->status != 1) {
            echo json_encode(['error' => 'Không thể xử lý đơn hàng này']);
            exit;
        }
        $this->load->model('PromotionDetail', 'Promotion');
        $this->Promotion->__set('table_name', 'promotion_order_view');
        $this->load->model('Debits_model', 'Debit');
        $promotions = $this->Promotion->get_array(['order_id' => $data->order_id]);
        $totalPromotionValue = 0;

        $dataPromotions = [];
        $totalAmount = 0;
        foreach ($order->order_detail as $product) {
            $totalAmount += $product->price * $product->quantity;
        }
        foreach ($promotions as $pro) {
            $moneyvalue = 0;
            if ($pro->money_discount) {
                $totalPromotionValue += $pro->quantity * $pro->money_discount;
                $moneyvalue = $pro->quantity * $pro->money_discount;
            } elseif ($pro->percent_discount) {
                $totalPromotionValue += $pro->quantity * ($totalAmount / 100 * $pro->percent_discount);
                $moneyvalue = $pro->quantity * ($totalAmount / 100 * $pro->percent_discount);
            }
            $temp = array(
                'product_gift' => $pro->product_gift,
                'product_gift_no' => $pro->product_gift_no * $pro->quantity,
                'product_gift_unit' => $pro->product_gift_unit,
                'money_discount' => $pro->money_discount * $pro->quantity,
                'percent_discount' => $pro->percent_discount * $pro->quantity,
                'other_gift' => $pro->other_gift,
                'money_value' => $moneyvalue
            );
            $dataPromotions[] = $temp;
        }

        if ($order->old_debit > 0) {
            $this->payDebit($order->customer_id, $order->old_debit);
        }

        $data_inset = [
            'partner' => $order->customer_id,
            'total_bill' => $data->price,
            'bill_code' => $order->order_code,
            'shipment_id' => $order->shipment_id,
            'note' => $order->note,
            'bill_inv' => $this->order->getSaleInventory($data->order_id),
            'old_debit' => $order->old_debit,
            'saler' => $order->saler
        ];

        if (empty($data->price)) $data->price = 0;
        $debit = (int)$order->total_price + $order->old_debit - $totalPromotionValue - (int)$data->price;
        $data_inset['debt'] = $debit > 0 ? $debit : 0;

        #init array for order detail
        foreach ($order->order_detail as $key => $row) {
            $data_inset['buy_price'][] = (object)['product_id' => $row->product_id,
                'quantity' => $row->quantity,
                'price' => $row->price];
        }

        $bill_id = $this->createBill((object)$data_inset);
        //save bill promotion
        $this->saveBillPromotion($bill_id, $dataPromotions);

        $this->order->update(['delivery' => "1"], ['id' => $data->order_id]);
//        $shipment = $this->order->get_array(['shipment_id' => $data->shipment_id, 'delivery' => '0']);
//        if (count($shipment) == 0) {
//            $this->load->model('shipments_model');
//            $this->shipments_model->update(['status' => '3'], ['id' => $data->shipment_id]);
//        }
        if ($debit <= 0) {
            $this->bill->update(['ignor_debit' => 1], ['customer_id' => $order->customer_id, 'id <=' => $order->last_bill]);
        }
    }

    private function createBillFromOrder($orderId, $totalPaid)
    {
        $this->load->model('order_model', 'order');
        $this->order->__set("table_name", "order");

        $order = $this->order->get_by_id($orderId);

        $this->load->model('PromotionDetail', 'Promotion');
        $this->Promotion->__set('table_name', 'promotion_order_view');
        $this->load->model('Debits_model', 'Debit');
        $promotions = $this->Promotion->get_array(['order_id' => $orderId]);
        $totalPromotionValue = 0;

        $dataPromotions = [];
        $totalAmount = 0;
        foreach ($order->order_detail as $product) {
            $totalAmount += $product->price * $product->quantity;
        }
        foreach ($promotions as $pro) {
            $moneyvalue = 0;
            if ($pro->money_discount) {
                $totalPromotionValue += $pro->quantity * $pro->money_discount;
                $moneyvalue = $pro->quantity * $pro->money_discount;
            } elseif ($pro->percent_discount) {
                $totalPromotionValue += $pro->quantity * ($totalAmount / 100 * $pro->percent_discount);
                $moneyvalue = $pro->quantity * ($totalAmount / 100 * $pro->percent_discount);
            }
            $temp = array(
                'product_gift' => $pro->product_gift,
                'product_gift_no' => $pro->product_gift_no * $pro->quantity,
                'product_gift_unit' => $pro->product_gift_unit,
                'money_discount' => $pro->money_discount * $pro->quantity,
                'percent_discount' => $pro->percent_discount * $pro->quantity,
                'other_gift' => $pro->other_gift,
                'money_value' => $moneyvalue
            );
            $dataPromotions[] = $temp;
        }

        if (empty($totalPaid)) $totalPaid = 0;
        $data_inset = [
            'partner' => $order->customer_id,
            'total_bill' => $totalPaid,
            'bill_code' => $order->order_code,
            'shipment_id' => $order->shipment_id,
            'note' => $order->note,
            'bill_inv' => $this->order->getSaleInventory($orderId),
            'old_debit' => $order->old_debit,
            'saler' => $order->saler,
        ];

        $debit = (int)$order->total_price + $order->old_debit - $totalPromotionValue - (int)$totalPaid;
        $data_inset['debt'] = $debit > 0 ? $debit : 0;

        #init array for order detail
        foreach ($order->order_detail as $key => $row) {
            $data_inset['buy_price'][] = (object)['product_id' => $row->product_id,
                'quantity' => $row->quantity,
                'price' => $row->price];
        }

        $bill_id = $this->createBill((object)$data_inset);
        //save bill promotion
        $this->saveBillPromotion($bill_id, $dataPromotions);

        $this->order->update(['delivery' => "1"], ['id' => $orderId]);
        $shipment = $this->order->get_array(['shipment_id' => $order->shipment_id, 'delivery' => '0']);
        if ($shipment && count($shipment) == 0) {
            $this->load->model('shipments_model');
            $this->shipments_model->update(['status' => '3'], ['id' => $order->shipment_id]);
        }
        if ($debit <= 0) {
            $this->bill->update(['ignor_debit' => 1], ['customer_id' => $order->customer_id, 'id <=' => $order->last_bill]);
        }

        return $data_inset;
    }

    private function updateInventoryWhenCreateBillDirectly($orderId)
    {
        $this->load->model('ProductUnitModel');
        $this->load->model('PromotionDetail', 'Promotion');
        $this->load->model('Products_model');
        $this->Promotion->__set('table_name', 'promotion_order_view');

        $this->load->model('order_model', 'order');
        $this->order->__set("table_name", "order");

        $error = [];

        $promotionProduct = [];

        $promotions = $this->Promotion->get_array(['order_id' => $orderId]);
        foreach ($promotions as $pro) {
            if ($pro->product_gift) {
                $rate = $this->ProductUnitModel->getConvertRate($pro->product_gift, $pro->product_gift_unit);
                if (empty($rate) || $rate->quantity <= 0) {
                    $tempPro = $this->Products_model->get_by_id($pro->product_gift);
                    $error[] = "Không tìm thấy quy đổi đơn vị của khuyến mãi - sản phẩm {$tempPro->name}";
                    break;
                }
                $promotionProduct[$pro->product_gift] = [
                    'productId' => $pro->product_gift,
                    'productQuantity' => $pro->quantity * $pro->product_gift_no,
                    'unit' => $pro->product_gift_unit,
                    'rate' => $rate->quantity,
                    'oderId' => $orderId
                ];
            }
        }


        if (!empty($error)) {
            throw new Exception(implode("<br />", $error));
        }

        //update warehouse
        $this->load->model('warehouse_wholesale_model', 'wholesale');
        $this->load->model('Order_detail_model');
        $order_detail = $this->Order_detail_model->get_by_order_id($orderId);
        if (count($order_detail) > 0) {
            $ids = array_column($order_detail, 'product_id');
            $ids = array_unique($ids);
            $current_inventories = $this->wholesale->getInventoryByIds($ids);
            $keys = array_column($current_inventories, 'product_id');
            $current_inventories = array_combine($keys, $current_inventories);

            foreach ($current_inventories as $product => $inventory) {
                $trathuong = $this->wholesale->getTotalInventoryOfAlias($product);
                if ($trathuong) {
                    $current_inventories[$product]['quantity'] += $trathuong->quantity;
                }
            }
            $allowExport = true;
            foreach ($order_detail as $id => $orderDetail) {
                if (!isset($current_inventories[$orderDetail->product_id])) {
                    $tempPro = $this->Products_model->get_by_id($orderDetail->product_id);
                    $error[] = "Không tìm thấy tồn kho sản phẩm {$tempPro->name}. Sản phẩm có thể đã bị xóa hoặc chưa được nhập hàng.";
                    $allowExport = false;
                } else {
                    $totalOrderQuan = (int)$orderDetail->quantity;
                    if (isset($promotionProduct[$orderDetail->product_id])) {
                        $totalOrderQuan += $promotionProduct[$orderDetail->product_id]['productQuantity'] / $promotionProduct[$orderDetail->product_id]['rate'];
                    }
                    if ((int)$current_inventories[$orderDetail->product_id]['quantity'] < $totalOrderQuan) {
                        $error[] = "Không đủ tồn kho của {$current_inventories[$orderDetail->product_id]['name']}.";
                        $allowExport = false;
                    }
                }
            }
            if (!empty($error)) {
                throw new Exception(implode("<br />", $error));
            }
        }

        //update inventory

        foreach ($order_detail as $product) {
            $inventories = $this->updateInventoryForSale($product->product_id, $product->quantity);
            foreach ($inventories as $inv) {
                $inv['order_id'] = $orderId;
                $this->order->addSaleInventory($inv);
            }
        }


        //inventory of promotion
        $this->load->model('Warehouses_model');
        foreach ($promotionProduct as $product) {
            $quantity = floor($product['productQuantity'] / $product['rate']);
            $odd = $product['productQuantity'] % $product['rate'];
            if ($odd) {
                $oddInv = $this->Warehouses_model->getOddInventory($product['productId']);
                $oddQuantity = 0;
                if (!$oddInv) {
                    $quantity += 1;
                    $insertdata = array(
                        'quantity' => $product['rate'] - $odd,
                        'product_id' => $product['productId'],
                        'unit' => $product['unit']
                    );
                    $this->db->insert('warehouse_odd_product', $insertdata);
                } elseif ($oddInv->quantity < $odd) {
                    $oddQuantity = $oddInv->quantity + $product['rate'] - $odd;
                    $quantity += 1;
                    $this->Warehouses_model->updateOddInventory($product['productId'], $oddQuantity);
                } else {
                    $oddQuantity = $oddInv->quantity - $odd;
                    $this->Warehouses_model->updateOddInventory($product['productId'], $oddQuantity);
                }
            }

            $inventories = $this->updateInventoryForSale($product['productId'], $quantity);
            foreach ($inventories as $inv) {
                $inv['order_id'] = $orderId;
                $inv['is_promotion'] = 1;
                $this->order->addSaleInventory($inv);
            }
            if ($odd) {
                $inv = end($inventories);
                $inv['quantity'] = $odd;
                $inv['promotion_unit'] = $product['unit'];
                $inv['order_id'] = $orderId;
                $inv['is_promotion'] = 1;
                $this->order->addSaleInventory($inv);
            }
        }
    }

    public function saveOrderDirectSale()
    {
        $data = $this->input->json();
        $thanhtoan = isset($data->thanhtoanhoadon) ? $data->thanhtoanhoadon : 0;
        $this->db->trans_begin();
        try {
            $orderId = $this->createNewOrder();
            $this->updateInventoryWhenCreateBillDirectly($orderId);
            $this->createBillFromOrder($orderId, $thanhtoan);
            $this->db->trans_commit();
        } catch (Exception $e) {
            $this->db->trans_rollback();
            echo json_encode(['error' => $e->getMessage()]);
            exit;
        }

        echo json_encode(['success' => true]);
    }

    private function saveBillPromotion($billId, $data)
    {
        $this->load->model('Bill_model');
        $this->Bill_model->__set('table_name', 'bill_promotion');
        foreach ($data as $billPromotion) {
            $billPromotion['bill_id'] = $billId;
            $this->Bill_model->insert($billPromotion);
        }
    }

    function convertBillCode($bill_id, $type = null)
    {
        $bill_code = $type . substr("00000000{$bill_id}", -9);
        return $bill_code;
    }

    #the main of this function is update quantity and total price of order
    function updateOrderInDivide()
    {
        $orders = $this->input->json();
        $this->load->model('order_detail_model', 'order_detail');

        #update quantity and total money in order detail
        $order_detail = $this->order_detail->get_array(['order_id' => $orders->order_id, 'product_id' => $orders->product_id]);
        if ($orders->quantity == '')
            $orders->quantity = 0;
        $order_detail[0]->total = (int)$orders->quantity * (int)$order_detail[0]->price;
        $order_detail[0]->quantity = (int)$orders->quantity;
        $this->order_detail->update($order_detail[0], ['id' => $order_detail[0]->id]);

        #update total price in order
        $updateTotal = $this->order_detail->count_total_price($orders->order_id);
        $updateTotal = $updateTotal->total;
        $this->order->update(['total_price' => $updateTotal], ['id' => $orders->order_id]);
        echo json_encode($orders);
    }

    public function getOrderDetail()
    {
        $order_id = $this->input->get('order_id');
        $order = $this->order->get_order_detail($order_id);
        $order->customer_detail = $this->customers->get_by_id($order->customer_id);
        $this->load->model('bill_model', 'bill');
        $debit = $this->bill->get_customer_debit($order->customer_id);
        if (isset($debit->debt))
            $order->customer_detail->debit = $debit->debt;
        else
            $order->customer_detail->debit = '';
        echo json_encode($order);
    }

    public function removeOrderFromShipment()
    {
        $order_id = $this->input->get('order_id');
        $this->order->update(['shipment_id' => null], ['id' => $order_id]);
        echo 'success';
    }

    public function get()
    {
        $id = $this->input->get('i');
        if ($id) {
            $order = $this->order->get_by_id($id);
            $this->order->__set('table_name', 'promotion_order_view');
            $promotions = $this->order->get_array(['order_id' => $id]);
            $groupedPros = [];
            foreach ($promotions as $pro) {
                $groupedPros[$pro->meta_id][] = ['quantity' => $pro->quantity, 'data' => $pro];
            }
            $order->promotions = array_values($groupedPros);
            echo json_encode($order);
        }
    }

    public function update()
    {
        $order = $this->input->json();
        $this->load->model('order_detail_model', 'order_detail');

        $this->order->update([
            'customer_id' => $order->customer_id,
            'total_price' => $order->total_price,
            'note' => $order->note,
            'saler' => $order->saler
        ], ['id' => $order->id]);
        $this->order_detail->delete(['order_id' => $order->id]);
        foreach ($order->orders as $key => $row) {
            $this->load->model('products_buy_price_model', 'products_buy');
            $cost = $this->products_buy->get_old_product($row->product_id, 'wholesale');
            if (count($cost) > 0)
                $row->cost = $cost->id;
            $order->orders[$key]->order_id = $order->id;
            $this->order_detail->insert($row);
        }

        //store promotion
        $this->order->__set('table_name', 'order_promotion');
        $this->order->delete(['order_id' => $order->id]);
        foreach ($order->lstProId as $pro) {
            $this->order->insert(['order_id' => $order->id, 'promotion_id' => $pro->id, 'quantity' => $pro->quantity]);
            var_dump($this->db->last_query());
        }
        echo json_encode('success');
    }

    public function saveDevided()
    {
        $this->checkAllowAccess(ROLE_ADMIN);
        $data = $this->input->json(true);

        if ($data) {
            $this->load->model('order_detail_model', 'OrderDetail');
            $orderIds = [];
            foreach ($data as $detail) {
                $orderDetail = $this->OrderDetail->get_by_id($detail->id);
                if ($orderDetail) {
                    if ($detail->quantity > 0) {
                        $this->OrderDetail->update(['quantity' => $detail->quantity], ['id' => $detail->id]);
                    } else {
                        $this->OrderDetail->delete(['id' => $detail->id]);
                    }
                    $orderIds[$orderDetail->order_id] = $orderDetail->order_id;
                }
            }

            // Update total price
            foreach ($orderIds as $orId) {
                $order = $this->order->get_by_id($orId);
                $totalPrice = 0;
                foreach ($order->order_detail as $detail) {
                    $totalPrice += $detail->quantity * $detail->price;
                }
                $this->order->update(['total_price' => $totalPrice], ['id' => $orId]);
            }
        }
    }

    public function getByTruck()
    {
        $id = $this->input->get('i', true);
        $this->load->model('Shipments_model', 'Shipmen');
        $date = date('Y-m-d');
        $shipment = $this->Shipmen->getShipmentByTruckAndDate($id, $date);
        $lastIndex = $this->Shipmen->getShipmentLastIndexByTruckAndDate($id, $date);
        if (empty($lastIndex->index)) {
            $lastIndex->index = 0;
        }
        echo json_encode(['shipment' => $shipment, 'lastIndex' => $lastIndex->index]);
    }

    public function getOrderByShipment()
    {
        $shipmentId = $this->input->get('i');
        $hasDetail = $this->input->get('d');
        $this->order->__set('table_name', 'order_view');
        $orders = $this->order->getByShipment($shipmentId);
        foreach ($orders as &$order) {
            $order['total_box'] = $this->countNumberOfBox($order['id']);
        }
        if ($hasDetail) {
            $this->load->model('order_detail_model', 'order_detail');
            $this->order_detail->__set('table_name', 'order_detail_view');
            $this->load->model('PromotionDetail', 'Promotion');
            $this->Promotion->__set('table_name', 'promotion_order_view');
            $this->load->model('Products_model');
            $this->load->model('ProductUnitModel');
            $this->load->model('Debits_model', 'Debit');
            foreach ($orders as $key => &$order) {
                $order['detail'] = $this->order_detail->get_array(array('order_id' => $order['id']));
                $promotions = $this->Promotion->get_array(['order_id' => $order['id']]);
                $totalPromotionValue = 0;
                $groupedPros = [];
                foreach ($promotions as $pro) {
                    if (!isset($groupedPros[$pro->meta_id])) {
                        $groupedPros[$pro->meta_id]['name'] = $pro->name;
                    }
                    $detail = [];
                    if ($pro->product_gift) {
                        $product = $this->Products_model->get_by_id($pro->product_gift);
                        $unit = $this->ProductUnitModel->get_by_id($pro->product_gift_unit);
                        $detail['title'] = $product->name;
                        $detail['unit'] = $unit->name;
                        $detail['quantity'] = $pro->quantity * $pro->product_gift_no;
                        $detail['value'] = '';
                        $detail['totalValue'] = '';
                    } elseif ($pro->other_gift) {
                        $detail['title'] = $pro->other_gift;
                        $detail['unit'] = '';
                        $detail['quantity'] = '';
                        $detail['value'] = '';
                        $detail['totalValue'] = '';
                    } elseif ($pro->money_discount) {
                        $detail['title'] = 'Chiết khấu';
                        $detail['unit'] = 'Xuất';
                        $detail['quantity'] = $pro->quantity;
                        $detail['value'] = $pro->money_discount;
                        $detail['totalValue'] = $pro->quantity * $pro->money_discount;
                        $totalPromotionValue += $detail['totalValue'];
                    } elseif ($pro->percent_discount) {
                        $detail['title'] = 'Chiết khấu';
                        $detail['unit'] = '%';
                        $detail['quantity'] = $pro->percent_discount;
                        $detail['value'] = $order['total_price'] / 100;
                        $detail['totalValue'] = $order['total_price'] / 100 * $pro->percent_discount;
                        $totalPromotionValue += $detail['totalValue'];
                    }
                    $groupedPros[$pro->meta_id]['detail'][] = $detail;
                }
                $order['promotions'] = array_values($groupedPros);
                $order['totalPromotionValue'] = $totalPromotionValue;
                $debit = $this->Debit->get_customer_total_debit($order['customer_id']);
                $order['currentDebit'] = $debit ? $debit->total_debit : 0;
            }
        }
        echo json_encode($orders);
    }

    public function nextShipment()
    {
        $id = $this->input->get('id');
        $date = $this->input->get('d');
        $date = date('Y-m-d', strtotime($date));
        $index = $this->input->get('i');
        $count = $this->db->where(['truck_id' => $id])->where("date_format(date, '%Y-%m-%d')='{$date}'")->count_all_results('shipments');
        echo json_encode(['next' => $count + 1]);
    }

    public function xoaShipment()
    {
        $this->checkAllowAccess(ROLE_ADMIN);
        $ids = $this->input->json(null, true);
        $lstId = [];
        foreach ($ids as $key => $value) {
            if ($value) {
                $lstId[] = $key;
            }
        }
        $this->order->xoaShipment($lstId);

    }

    public function xoaChuyen()
    {
        $this->checkAllowAccess(ROLE_ADMIN);
        $id = $this->input->get('id');
        $this->order->removeShipment($id);
        $this->load->model('Shipments_model', 'Shipment');
        $this->Shipment->delete(['id' => $id]);
    }

    public function doiShipment()
    {
        $this->checkAllowAccess(ROLE_ADMIN);
        $data = $this->input->json(null, true);
        $lstId = [];
        foreach ($data['id'] as $key => $value) {
            if ($value) {
                $lstId[] = $key;
            }
        }
        $this->order->doiShipment($lstId, $data['shipment_id']);
    }

    public function getByShipment()
    {
        $this->checkAllowAccess(ROLE_ADMIN);
    }

    //copy from warehouse_wholesale_sale
    private function createBill($bill)
    {
        #create bill
        $data_bill = array('customer_id' => $bill->partner, 'price_total' => $bill->total_bill, 'note' => $bill->note, 'shipment_id' => $bill->shipment_id, 'old_debit' => $bill->old_debit);
        $this->load->model('bill_model', 'bill');
        $this->load->model('bill_detail_model', 'bill_detail');
        $this->load->model('debits_model', 'debits');
        $this->load->model('products_sale_price_model', 'product_sale');
        $this->load->helper('Constants');

        if (isset($bill->bill_code))
            $data_bill['bill_code'] = $bill->bill_code;
        if (isset($bill->ignor_statistic)) {
            $data_bill['ignor_statistic'] = $bill->ignor_statistic;
        }
        if (isset($bill->debt)) {
            $data_bill['debit'] = $bill->debt;
            $checkDebit = $this->bill->get_customer_debit($bill->partner);
            if ($checkDebit) {
                #update debit of customer
                $new_price = (int)$checkDebit->debt + (int)$bill->debt;
                $this->debits->update(array('price' => $new_price), array('customer_id' => $bill->partner, 'type' => 'debit'));
            } else {
                $this->debits->insert(array('price' => (int)$bill->debt,
                    'customer_id' => $bill->partner,
                    'type' => 'debit'));
            }
        }

        if (isset($bill->saler)) {
            $data_bill['saler'] = $bill->saler;
        }

        $bill_id = $this->bill->insert($data_bill);

        if (!isset($bill->bill_code)) {
            $code_bill = 'CH' . substr("00000000{$bill_id}", -9);;
            $this->bill->update(array('bill_code' => $code_bill), array('id' => $bill_id));
        }

        #create bill detail
        foreach ($bill->buy_price as $key => $row) {
            $bill_detail = array(
                'bill_id' => $bill_id,
                'product_id' => $row->product_id,
                'quantity' => $row->quantity,
                'price' => $row->price
            );
            if ($row->quantity > 0) {
                $systemPrice = $this->product_sale->get_unit_primary($row->product_id);
                $bill_detail['sys_price'] = $systemPrice ? $systemPrice->price : 0;
                $bill_detail['commission_type'] = $systemPrice && $systemPrice->price > $row->price ? Constants::COMMISSION_WHOLESALE : Constants::COMMISSION_RETAIL;
            }
            $bill_detail['returned'] = isset($row->returned) && $row->returned > 0 ? $row->returned : 0;
            $this->bill_detail->insert($bill_detail);
        }

        //create bill inventory detail
        foreach ($bill->bill_inv as $inv) {
            $inv = (array)$inv;
            unset($inv['id']);
            $inv['order_id'] = $bill_id;
            $this->bill->addBillInventory($inv);
        }

        return $bill_id;
    }

    private function createPaidBillByOrder($order)
    {
        $this->load->model('Debits_model', 'Debit');
        $this->load->model('Bill_model', 'bill');
        if ($order->old_debit) {
            $bill_data = [
                'customer_id' => $order->customer_id,
                'price_total' => 0,
                'debit' => -1 * $order->old_debit,
                'note' => 'Nhập vào đơn hàng ' . $order->order_code
            ];
            $bill_id = $this->bill->insert($bill_data);
            $code_bill = 'W' . substr("00000000{$bill_id}", -9);;
            $this->bill->update(['bill_code' => $code_bill], ['id' => $bill_id]);
        }
    }

    /**
     * Tinh tong so thung hang trong don hang
     * @param $orderid
     */
    private function countNumberOfBox($orderid)
    {
        $this->load->model('Order_detail_model', 'OrderDetail');
        $this->OrderDetail->__set('table_name', 'order_detail_view');
        $orderDetails = $this->OrderDetail->get_array(['order_id' => $orderid]);
        $count = 0;
        foreach ($orderDetails as $detail) {
            if (strpos(strtolower($detail->product_name), 'ly') !== false) {
                $count += 2 * $detail->quantity;
            } else {
                $count += $detail->quantity;
            }
        }
        return $count;
    }

    public function popoverData()
    {
        $id = $this->input->get('id');
        $order = $this->order->get_by_id($id);

        $this->load->model('PromotionDetail', 'Promotion');
        $this->Promotion->__set('table_name', 'promotion_order_view');
        $this->load->model('Products_model');
        $this->load->model('ProductUnitModel', 'ProductUnit');

        $promotions = $this->Promotion->get_array(['order_id' => $order->id]);
        $totalPromotionValue = 0;
        $promotionProducts = [];
        $otherGifts = [];

        foreach ($promotions as $pro) {
            if ($pro->money_discount) {
                $totalPromotionValue += $pro->quantity * $pro->money_discount;
            } elseif ($pro->percent_discount) {
                $totalPromotionValue += $order->total_price / 100 * $pro->percent_discount;
            } elseif ($pro->product_gift) {
                $unit = $this->ProductUnit->get_by_id($pro->product_gift_unit);
                if (isset($promotionProducts[$pro->product_gift])) {
                    if (isset ($promotionProducts[$pro->product_gift]->unit[$pro->product_gift_unit])) {
                        $promotionProducts[$pro->product_gift]->unit[$pro->product_gift_unit]->quantity += $pro->quantity;
                    } else {
                        $newProdUnit = new StdClass();
                        $newProdUnit->quantity = $pro->quantity;
                        $newProdUnit->unit = $unit->name;
                        $promotionProducts[$pro->product_gift]->unit[$pro->product_gift_unit] = $newProdUnit;
                    }

                } else {
                    $product = $this->Products_model->getSingle($pro->product_gift);


                    $productPromotion = new StdClass();
                    $productPromotion->productName = $product->name;

                    $newProdUnit = new StdClass();
                    $newProdUnit->quantity = $pro->quantity;
                    $newProdUnit->unit = $unit->name;

                    $productPromotion->unit = [$pro->product_gift_unit => $newProdUnit];

                    $promotionProducts[$pro->product_gift] = $productPromotion;
                }
            } else {
                $otherGifts[] = $pro->other_gift;
            }
        }
        $order->chietKhau = $totalPromotionValue;
        $order->khuyenMai = $promotionProducts;
        $order->orderGifts = $otherGifts;

        $content = $this->load->view("orderPopover", ['order' => $order], true);
        echo $content;
    }

    public function addOldDebitToOrder()
    {
        $debit = $this->input->post('debit');
        $id = $this->input->post('id');
        if ($id && $debit) {
            $this->order->update(['old_debit' => $debit], ['id' => $id]);
        }
    }

    public function removeOldDebitFromOrder()
    {
        $id = $this->input->post('id');
        if ($id) {
            $this->order->update(['old_debit' => 0], ['id' => $id]);
        }
    }

    public function payDebit($cusId, $value)
    {
        $this->load->model('Bill_model', 'bill');

        $bills = $this->bill->getDebit($cusId);
        $totalCurrent = 0;
        foreach ($bills as $bill) {
            $totalCurrent += $bill->debit;
        }

        $cutoff = $totalCurrent - $value;
        $bills = array_reverse($bills);
        $deb = 0;
        foreach ($bills as $bill) {
            if ($deb < $cutoff) {
                $deb += $bill->debit;
                continue;
            }

            $this->bill->update(['ignor_debit' => 1], ['id' => $bill->id]);
        }
    }

    public function processAllShipmentData()
    {
        $shipmentData = (array)$this->input->post('shipmentDetail');
        if (empty($shipmentData) || empty($shipmentData['shipment_id'])) {
            http_response_code(400);
            exit;
        }
        $this->load->model('Shipments_model', 'shipments');
        $shipment = $this->shipments->getShipment($shipmentData['shipment_id']);
        if (empty($shipment) || $shipment->status != 2) {
            http_response_code(204);
            exit;
        }

        $this->db->trans_start();

        $delivered = $this->input->post('orderDelivered');
        if (!empty($delivered)) {
            foreach ($delivered as $data) {
                $this->orderDelivered($data);
            }
        }

        $returnData = $this->input->post('returnWarehouse');
        if (!empty($returnData)) {
            foreach ($returnData as $data) {
                $this->returnWarehouse($data);
            }
        }

        $processReturnHalfWarehouse = $this->input->post('processReturnHalfWarehouse');
        if (!empty($processReturnHalfWarehouse)) {
            foreach ($processReturnHalfWarehouse as $data) {
                $this->processReturnHalfWarehouse($data);
            }
        }

        $this->saveShipmentPaymentDetail($shipmentData);

        $this->db->trans_complete();
    }

    protected function saveShipmentPaymentDetail($data) {
        $this->load->model('Shipments_model','shipments');
        $shipmentId = $data['shipment_id'];
        $paymentDetail = $data['payment_detail'];
        $note = empty($data['note']) ? '' : $data['note'];

        if( $shipmentId && $shipment = $this->shipments->getShipment($shipmentId) ) {
            $this->shipments->update(['note' => $note ], ['id' => $shipmentId]);

            $this->shipments->table_name = 'shipment_payment_detail';
            foreach( $paymentDetail as $money ) {
                $insertData = [
                    'shipment_id' => $shipmentId,
                    'money_value' => $money->tien,
                    'quantity' => $money->soluong,
                ];

                $this->shipments->insert($insertData);
            }
        }

    }
}