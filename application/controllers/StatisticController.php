<?php
/**
 * Created by PhpStorm.
 * User: XYZ
 * Date: 15-07-2018
 * Time: 23:59
 */
class StatisticController extends MY_Controller
{

    public function __construct()
    {
        $this->requiredRoleLevel = ROLE_ADMIN;
        parent::__construct();
    }

    public function sales(){
        $from = $this->input->get('from');
        $to = $this->input->get('to');
        $from = $to? date ('Y-m-d 00:00:00', strtotime($from)) : date ('Y-m-d 00:00:00');
        $to = $to? date ('Y-m-d 23:59:59', strtotime($to)) : date ('Y-m-d  23:59:59', strtotime($from));

        $this->load->model('Bill_model');
        $this->load->model('Products_model');
        $this->load->model('products_buy_price_model','product_buy');
        $rawdata = $this->Bill_model->salesStatistic($from, $to);
        $cost = $this->Bill_model->getCostByBills($from, $to);
        $cost = array_column($cost, 'total_value', 'product_id');

        // Get promotion
        $promotions = $this->Bill_model->promotionStatistic($from, $to);
        $promotionProducts = [];
        $totalPromotionMoney = 0;
        $this->load->model('Products_sale_price_model', 'ProductSalePrice');
        $this->load->model('ProductUnitModel', 'ProductUnit');
        $units = $this->ProductUnit->getListReturnArray();
        $unitIds = array_column($units, 'id');
        $units = array_combine($unitIds, $units);

        $statisticData = [];
        foreach($promotions as $promotion) {
            if ($promotion->product_gift) {
                $conversionrate = $this->ProductSalePrice->get_array(['product_id' => $promotion->product_gift, 'unit' => $promotion->product_gift_unit]);
                if (isset($statisticData[$promotion->product_gift])) {
                    $statisticData[$promotion->product_gift]->promotion['quantity'] += $promotion->product_gift_no;
                } else {
                    $proData['rate'] = count($conversionrate) ? $conversionrate[0]->quantity : 1;
                    $proData['id'] = $promotion->product_gift;
                    $proData['quantity'] = $promotion->product_gift_no;
                    $proData['unit'] = isset($units[$promotion->product_gift_unit]) ? $units[$promotion->product_gift_unit]['name'] : '';

                    $newdata = new stdClass();
                    $newdata->totalQuantity = 0;
                    $newdata->totalAmount = 0;
                    $newdata->count = 0;
                    $newdata->promotion = $proData;
                    $newdata->priceDetail = [] ;
                    $tempProduct = $this->Products_model->get_by_id($promotion->product_gift);
                    $newdata->productName = $tempProduct->name;
                    $newdata->proId = $promotion->product_gift;
                    $newdata->cost = 0;
                    $statisticData[$promotion->product_gift] = $newdata;
                }
            } elseif ($promotion->money_discount) {
                $totalPromotionMoney += $promotion->money_discount;
            } elseif($promotion->percent_discount) {
                $totalPromotionMoney += $promotion->price_total * $promotion->percent_discount / 100;
            }
        }

        $maxLength = 0;
        $totalAmount = 0;
        $totalProfit = 0;
        foreach($rawdata as $data) {
            if (isset($statisticData[$data->proid])) {
                $statisticData[$data->proid]->totalQuantity += $data->sum_quan;
                $statisticData[$data->proid]->totalAmount += $data->sum_quan * $data->price;
                $statisticData[$data->proid]->count += 1;
                $statisticData[$data->proid]->cost = isset($cost[$data->proid]) ? $cost[$data->proid] : 0;
            } else {
                $newdata = new stdClass();
                $newdata->totalQuantity = $data->sum_quan;
                $newdata->totalAmount = $data->sum_quan * $data->price;
                $newdata->count = 1;
                $newdata->promotion = null;
                $newdata->productName = $data->product_name;
                $newdata->proId = $data->proid;
                $newdata->cost = isset($cost[$data->proid]) ? $cost[$data->proid] : 0;
                $statisticData[$data->proid] = $newdata;
            }
            $priceDetail = new stdClass();
            $priceDetail->price = $data->price;
            $priceDetail->quantity = $data->sum_quan;
            $statisticData[$data->proid]->priceDetail[] = $priceDetail;
            if ($statisticData[$data->proid]->count > $maxLength) {
                $maxLength = $statisticData[$data->proid]->count;
            }
            $totalAmount += $data->sum_quan * $data->price;
        }

        array_walk($statisticData, function($item) {
            if (!is_null($item->promotion)) {
                if ($item->cost > 0) {
                    $item->promotionCost = $item->cost / $item->totalQuantity;
                } else {
                    $lastBuyPrice = $this->product_buy->get_latest_buy_price($item->proId);
                    $item->promotionCost = empty($lastBuyPrice) ? 0 : $lastBuyPrice->price;
                }
            }
        });
        $responsedata = [
            'statisticData' => array_values($statisticData),
            'maxLength' => $maxLength,
            'totalAmount' => $totalAmount,
            'totalProfit' => $totalProfit,
            'totalDiscount' => $totalPromotionMoney,
            'totalDebit' => $this->Bill_model->statisticTotalDebit($from, $to),
            'totalCash' => $this->Bill_model->statisticTotalCash($from, $to),
            'from' => date('d-m-Y', strtotime($from)),
            'to' => date('d-m-Y', strtotime($to))];
        echo json_encode($responsedata);
    }
    public function getBillList() {
        $proid = $this->input->get('product');
        $price = $this->input->get('price');
        $from =  $this->input->get('from');
        $to =  $this->input->get('to');
        $from = date('Y-m-d 00:00:00', strtotime($from));
        $to = date('Y-m-d 23:59:59', strtotime($to));

        $this->load->model('bill_model');
        $bill = $this->bill_model->salesStatisticBillList($from, $to, $proid, $price);
        echo json_encode(array('bill' => array_values($bill)));
    }

    public function getSalesCommissions() {
        $from =  $this->input->get('from');
        $to =  $this->input->get('to');
        if ( empty( $from) || empty( $to)){
            echo json_encode([]);
        } else {
            $this->load->model('products_type_model', 'product_type');
            $this->load->model('products_model', 'product');
            $this->load->model('bill_model');
            $this->load->helper('Constants');
            $this->load->model('Staff_model');

            $from = date('Y-m-d 00:00:00', strtotime($from));
            $to = date('Y-m-d 23:59:59', strtotime($to));
            $commissionData = $this->bill_model->getSalesCommissionStatistic($from, $to);

            $listProduct = $this->product->getListReturnArray(['active' => '0']);
            $listProduct = array_combine(array_column($listProduct, 'id'), $listProduct);

            foreach ($commissionData as $commission) {
                $wholesale = $commission['commission_type'] == Constants::COMMISSION_WHOLESALE ? $commission['quantity'] : 0;
                $retail = $commission['commission_type'] == Constants::COMMISSION_RETAIL ? $commission['quantity'] : 0;
                if (!isset($listProduct[$commission['product_id']]['commissions'])) {
                    $listProduct[$commission['product_id']]['commissions'] = [];
                }
                if (!isset($listProduct[$commission['product_id']]['commissions'][$commission['saler']])) {
                    $listProduct[$commission['product_id']]['commissions'][$commission['saler']] = [
                        'wholesale' => 0,
                        'retail' => 0,
                        'amount' => 0,
                    ];
                }

                $listProduct[$commission['product_id']]['commissions'][$commission['saler']]['wholesale'] += $wholesale;
                $listProduct[$commission['product_id']]['commissions'][$commission['saler']]['retail'] += $retail;
                $listProduct[$commission['product_id']]['commissions'][$commission['saler']]['amount'] += $commission['quantity'] * $commission['price'];
            }

            usort($listProduct, function ($a, $b) {
                if ($a['product_type'] < $b['product_type']) return -1;
                if ($a['product_type'] > $b['product_type']) return 1;
                if ($a['name'] < $b['name']) return -1;
                if ($a['name'] > $b['name']) return 1;
                return 0;
            });

            $listProductType = $this->product_type->getListReturnArray(['active' => 0]);
            $listProductType = array_combine(array_column($listProductType, 'id'), $listProductType);
            foreach ($listProduct as $index => $product) {
                $listProduct[$index]['productTypeName'] = isset($listProductType[$product['product_type']]) ? $listProductType[$product['product_type']]['name'] : '';
            }

            echo json_encode(
                array_values($listProduct)
            );
        }

    }

    public function getSaleCommissionMetaData() {
        $this->load->model('products_type_model', 'product_type');
        $this->load->model('Staff_model');
        $this->load->helper('Constants');

        $listProductType = $this->product_type->get_array(['active' => 0]);
        $listSaler = $this->Staff_model->getByPosition(Constants::STAFF_SALER);
        echo json_encode(
            [
                'salers' => $listSaler,
                'productType' => array_values( $listProductType ),
            ]
        );
    }

    public function getSaleCommissionDetail() {
        $proid = $this->input->get('product');
        $type = $this->input->get('type');
        $saler = $this->input->get('saler');
        $from =  $this->input->get('from');
        $to =  $this->input->get('to');
        $from = date('Y-m-d 00:00:00', strtotime($from));
        $to = date('Y-m-d 23:59:59', strtotime($to));

        $this->load->model('bill_model');
        $bill = $this->bill_model->getListBillOfSaleCommission($from, $to, $proid, $saler, $type);
        echo json_encode(array('bill' => array_values($bill)));
    }
}