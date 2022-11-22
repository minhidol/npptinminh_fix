<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Bill_detail extends MY_Controller {

    public function __construct() {
        $this->requiredRoleLevel = ROLE_ADMIN;
        parent::__construct();
        $this->load->model('bill_model','bill');
        $this->load->model('products_sale_price_model','product_sale');
    }
    public function index() {
        $id = $_GET['id'];
        $type = $_GET['type'];
        $this->load->model('customers_model','customer');
        $bill_detail = $this->bill->get_by_id($id);
        $debt_bill = $this->bill->get_customer_debit($bill_detail->customer_id);
        
        if($debt_bill->debt)
            $bill_detail->total_debit = (int)$debt_bill->debt;
        else
            $bill_detail->total_debit = 0;
        
        $bill_detail->customer = $this->customer->get_by_id($bill_detail->customer_id);
        foreach ($bill_detail->detail as $key => $row){
            if($type == 'wholesale')
                $bill_detail->detail[$key]->unit = $this->product_sale->get_unit_primary($row->product_id);
            else
                $bill_detail->detail[$key]->unit = $this->product_sale->get_unit_retail($row->product_id);
        }

        $this->bill->__set('table_name', 'bill_promotion_view');
        $promotions = $this->bill->get_array(['bill_id' => $id]);

        $this->load->model('ProductUnitModel');
        $units = $this->ProductUnitModel->getListReturnArray();
        $units = array_column($units, 'name', 'id');

        foreach($promotions as &$promotion) {
            if ($promotion->product_gift) {
                $promotion->name = 'Tặng ' . $promotion->product_name;
                $promotion->unit_name = (isset($units[$promotion->product_gift_unit])) ? $units[$promotion->product_gift_unit] : '';
                $promotion->quantity = $promotion->product_gift_no;
                $promotion->value = '';
            } elseif ($promotion->money_discount) {
                $promotion->name = 'Chiết khấu tiền';
                $promotion->unit_name = 'Xuất';
                $promotion->quantity = 1;
                $promotion->value = $promotion->money_value;
            } elseif ($promotion->percent_discount) {
                $promotion->name = 'Chiết khấu %';
                $promotion->unit_name = '%';
                $promotion->quantity = $promotion->percent_discount;
                $promotion->value = $promotion->money_value;
            } else {
                $promotion->name = $promotion->other_gift;
                $promotion->unit_name = '';
                $promotion->quantity = '';
                $promotion->value = '';
            }
        }

        $bill_detail->promotions = $promotions;

        echo json_encode(array('bill' => $bill_detail));
    }

	public function viewShipmentBills() {
		$this->checkAllowAccess( ROLE_ADMIN );
		$shipment_id = $this->input->get( 'shipment_id' );
		$this->load->model( 'shipments_model' );
		$this->load->library( 'convert_unit' );
		$this->load->model( 'customers_model', 'customers' );

		$this->load->model( 'Bill_detail_model', 'bill_detail' );
		$this->load->model( 'Staff_model' );

		$shipment = $this->shipments_model->get_bills_by_id( $shipment_id );

		#get bills
		$bills         = $this->bill->get_array( [ 'shipment_id' => $shipment_id ] );
		$product_group = [];

		#get all order by shipment and group product by product id
		$total_quantity = [ 'detail' => [], 'product_name' => 'Tổng', 'totalOriginalQuantity' => 0, 'totalOriginalValue' => 0, 'totalReturn' => 0, 'totalValue' => 0 ];
		foreach ( $bills as $key => $row ) {
			$bills[ $key ]->customer_detail = $this->customers->get_by_id( $row->customer_id );
			$bills[ $key ]->bill_detail     = $this->bill_detail->get_bill_detail( $row->id );
			$totalReturned = 0;
			$totalOriginalPrice = 0;
			$totalOriginalQuantity = 0;
			$returnedDetail = $row->note;
			foreach ( $row->bill_detail as $index => $item ) {
				if ( isset( $total_quantity['detail'][ $item->bill_id ] ) ) {
					$total_quantity['detail'][ $item->bill_id ] += (int) $item->quantity;
				} else {
					$total_quantity['detail'][ $item->bill_id ] = (int) $item->quantity;
				}

				if ( isset( $product_group[ $item->product_id ] ) ) {
					array_push( $product_group[ $item->product_id ], $item );
				} else {
					$product_group[ $item->product_id ] = [ $item ];
				}

				$totalReturned += $item->returned;
				$totalOriginalPrice += ($item->quantity + $item->returned) * $item->price;
				$totalOriginalQuantity += ($item->quantity + $item->returned);
				if ( $item->returned > 0 ) {
					$returnedDetail .= "\n[r-{$item->product_id}]: {$item->returned}";
				}
			}
			$bills[ $key ]->totalReturned = $totalReturned;
			$bills[ $key ]->totalOriginalPrice = $totalOriginalPrice;
			$bills[ $key ]->totalOriginalQuantity = $totalOriginalQuantity;
			$bills[ $key ]->returnedDetail = $returnedDetail;
			$total_quantity['totalOriginalQuantity'] += $totalOriginalQuantity;
			$total_quantity['totalOriginalValue'] += $totalOriginalPrice;
			$total_quantity['totalReturn'] += $totalReturned;
			$total_quantity['totalValue'] += $row->price_total;
		}
		usort($product_group, function($a, $b){
			return $a[0]->index > $b[0]->index;
		});
		//Get promotion
		$this->load->model( 'PromotionDetail', 'Promotion' );
		$this->Promotion->__set( 'table_name', 'bill_promotion_view' );
		$lispromotion = [];
		$this->load->model( 'ProductUnitModel' );
		$shipmentValue = 0;
		foreach ( $bills as $bill ) {
			$promotions = $this->Promotion->get_array( [ 'bill_id' => $bill->id ] );
			foreach ( $promotions as $promo ) {
				if ( $promo->product_gift ) {
					if ( isset( $lispromotion[ $promo->product_gift ] ) ) {
						$lispromotion[ $promo->product_gift ]['quantity'] += $promo->product_gift_no;
					} else {
						$prounit                              = $this->ProductUnitModel->get_by_id( $promo->product_gift_unit );
						$lispromotion[ $promo->product_gift ] = [
							'quantity' => $promo->product_gift_no,
							'unit'     => $prounit->name
						];
					}
				}
			}

			$shipmentValue += $bill->price_total;
		}

		#repare array product for each other in view
		$list_product                     = [];
		$total_quantity['total_quantity'] = 0;
		foreach ( $product_group as $index => $row ) {
			$list = [];
			foreach ( $bills as $key => $value ) {
				$list['detail'][ $value->id ] = [];
				$list['total_quantity']       = 0;
				$list['total_returned']       = 0;
				$returnedDetail = $value->returnedDetail;
				foreach ( $row as $item => $prod ) {
					$returnedDetail = str_replace("[r-{$prod->product_id}]", $prod->product_name, $returnedDetail);
					$list['product_name']   = $prod->product_name;
					$list['total_quantity'] += (int) $prod->quantity;
					$list['product_id']     = $prod->product_id;
					$list['total_returned'] += (int) $prod->returned;
					if ( $prod->bill_id == $value->id ) {
						$list['detail'][ $value->id ] = $prod->quantity;
					}
					if ( is_array( $list['detail'][ $value->id ] ) ) {
						$list['detail'][ $value->id ] = '';
					}

					if ( isset( $lispromotion[ $prod->product_id ] ) ) {
						$list['promotion'] = $lispromotion[ $prod->product_id ];
						unset( $lispromotion[ $prod->product_id ] );
					}
				}
				$value->returnedDetail = $returnedDetail;
			}
			$list['total_returned_detail'] = $returnedDetail;

			$total_quantity['total_quantity'] += $list['total_quantity'];
			array_push( $list_product, $list );
		}

		$this->load->model( 'Products_model', 'Product' );
		$this->load->model('Warehouse_wholesale_model', 'warehouse_wholesale');
		foreach ( $lispromotion as $prodid => $promo ) {
			$inventory = $this->warehouse_wholesale->getInventoryById( $prodid );
			$inventory = $inventory ? $inventory->quantity : 0;
			$trathuong = $this->warehouse_wholesale->getTotalInventoryOfAlias( $prodid );
			$trathuong = $trathuong ? $trathuong->quantity : 0;
			$product   = $this->Product->get_by_id( $prodid );
			$list      = [
				'product_name'   => $product->name,
				'detail'         => [],
				'total_quantity' => 0,
				'product_id'     => $prodid,
				'inventory'      => $inventory + $trathuong,
				'promotion'      => $promo
			];
			array_push( $list_product, $list );
		}
		$list_product = [ 'summary' => $total_quantity, 'detail' => $list_product ];

		#get information of truck and staff
		$this->load->model( 'trucks_model', 'trucks' );
		$this->load->model( 'staff_model', 'staff' );
		$trucks = $this->trucks->get_array( [ 'active' => 0 ] );

        $shipmentMoney = $this->shipments_model->getShipmentPaymentDetail( $shipment_id );
        $totalMoney = 0;

        foreach($shipmentMoney as $item){
            $totalMoney += $item->money_value * $item->quantity;
        }

		echo json_encode( [
				'orderList'   => $bills,
				'productList' => $list_product,
				'shipment_id' => $shipment_id,
				'shipment'    => $shipment,
				'trucks' => $trucks,
                'moneyDetail' => $shipmentMoney,
                'totalCash' => $totalMoney,
                'shipmentValue' => $shipmentValue,
			]
		);
	}

	public function viewImportDetail() {
        $id = $this->input->get('id');

        $this->load->model('warehousing_model');
        $this->load->model('products_buy_price_model', 'product_buy');
        $this->load->model('customers_model','customer');

        $result = [];
        if ( $warehousing = $this->warehousing_model->get_by_id( $id ) ) {
            $result['warehousing'] = $warehousing;
            $result['detail'] = $this->product_buy->get_by_warehousing_id( $id );
            $result['partner'] = $this->customer->get_by_id($warehousing->partner_id);
        }

        echo json_encode( $result );
    }

    public function popoverData() {
        $id = $this->input->get('id');
        $bill = $this->bill->get_by_id( $id );

        $this->bill->__set('table_name', 'bill_promotion_view');
        $promotions = $this->bill->get_array(['bill_id' => $id]);

        $this->load->model('ProductUnitModel');
        $units = $this->ProductUnitModel->getListReturnArray();
        $units = array_column($units, 'name', 'id');

        $totalPromotionValue = 0;
        $promotionProducts = [];
        $otherGifts = [];

        foreach($promotions as $promotion) {

            if ($promotion->money_discount || $promotion->percent_discount ) {
                $totalPromotionValue += $promotion->money_value;
            } elseif($promotion->product_gift) {
                if (isset($promotionProducts[$promotion->product_gift])) {
                    if (isset ($promotionProducts[$promotion->product_gift]->unit[$promotion->product_gift_unit])) {
                        $promotionProducts[$promotion->product_gift]->unit[$promotion->product_gift_unit]->quantity += $promotion->product_gift_no;
                    } else {
                        $newProdUnit = new StdClass();
                        $newProdUnit->quantity = $promotion->product_gift_no;
                        $newProdUnit->unit = (isset($units[$promotion->product_gift_unit])) ? $units[$promotion->product_gift_unit] : '';;
                        $promotionProducts[$promotion->product_gift]->unit[$promotion->product_gift_unit] = $newProdUnit;
                    }

                } else {
                    $productPromotion = new StdClass();
                    $productPromotion->productName = $promotion->product_name;

                    $newProdUnit = new StdClass();
                    $newProdUnit->quantity = $promotion->product_gift_no;
                    $newProdUnit->unit = (isset($units[$promotion->product_gift_unit])) ? $units[$promotion->product_gift_unit] : '';;

                    $productPromotion->unit = [$promotion->product_gift_unit => $newProdUnit];

                    $promotionProducts[$promotion->product_gift] = $productPromotion;
                }
            }
            else {
                $otherGifts[] = $promotion->other_gift;
            }
        }

        $bill->chietKhau = $totalPromotionValue;
        $bill->khuyenMai = $promotionProducts;
        $bill->orderGifts = $otherGifts;

        $this->load->model('Shipments_model');

        $content = $this->load->view("orderPopover", ['order' => $bill, 'moneyDetail' => []], true);
        echo $content;
    }
}
