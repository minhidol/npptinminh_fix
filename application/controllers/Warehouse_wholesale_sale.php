<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Warehouse_wholesale_sale extends MY_Controller
{

    public function __construct()
    {
        $this->requiredRoleLevel = ROLE_ADMIN;
        parent::__construct();
        $this->load->model('bill_model', 'bill');
        $this->load->model('products_sale_price_model', 'product_sale');
        $this->load->model('products_buy_price_model', 'product_buy');
        $this->load->model('warehouse_wholesale_model', 'wholesale');
        $this->load->model('bill_detail_model', 'bill_detail');
    }

    public function index()
    {
        $from = $this->input->get('from');
        $to = $this->input->get('to');
        $search = $this->input->get("search");
        if(!$from) {
            $from = date('Y-m-d H:i:s', strtotime('last month'));
        }
        if(!$to) $to = date('Y-m-d H:i:s');

        $bills = [];
        $from = date('Y-m-d 00:00:00', strtotime($from));
        $to = date('Y-m-d 23:59:59', strtotime($to));

        if($from) {
            $bills = $this->bill->getWithTruck(['warehouse' => 'wholesale'], $search, $from, $to);
        } else {
            $bills = $this->bill->getWithTruck(['warehouse' => 'wholesale'], $search);
        }

        $metadata = [];
        $chuyen = [];
        usort($bills, function($a, $b) {
            return $a->created == $b->created? ($a->truck_name == $b->truck_name? $a->shipment_name < $b->shipment_name : $a->truck_name < $b->truck_name) : $a->created < $b->created;
        });
        foreach($bills as $value) {
            $year = date('Y', strtotime($value->created));
            $month = date('m', strtotime($value->created));
            $date = date('d', strtotime($value->created));
            if (!isset($metadata[$year])) {
                $metadata[$year]['show'] = false;
                $metadata[$year]['display'] = $year;
            }
            if (!isset($metadata[$year]['detail'][$month])) {
                $metadata[$year]['detail'][$month]['show'] = false;
                $metadata[$year]['detail'][$month]['display'] = $month;
            }
            if (!isset($metadata[$year]['detail'][$month]['detail'][$date])) {
                $metadata[$year]['detail'][$month]['detail'][$date]['show'] = false;
                $metadata[$year]['detail'][$month]['detail'][$date]['display'] = $date;
            }
            if (!isset($metadata[$year]['detail'][$month]['detail'][$date]['detail'][$value->truck_name])) {
                $metadata[$year]['detail'][$month]['detail'][$date]['detail'][$value->truck_name]['show'] = false;
                $metadata[$year]['detail'][$month]['detail'][$date]['detail'][$value->truck_name]['display'] = $value->truck_name;
            }
            $metadata[$year]['detail'][$month]['detail'][$date]['detail'][$value->truck_name]['detail'][$value->shipment_id] = ['display' =>  $value->shipment_name, 'id' => $value->shipment_id];
            $chuyen[$value->shipment_id][] = $value;

        }
        echo json_encode(['meta' => $metadata, 'data' => $chuyen, 'bills' => $bills]);
    }

    public function getPrice()
    {
        $id = $_GET['id'];
        $price = $this->product_sale->get_by_id($id);
        echo json_encode($price);
    }

    public function createBill($bill = null, $from = null) {
	    if ( ! isset( $bill ) ) {
		    $bill = $this->input->json();
	    }

	    #create bill
	    $data_bill = [
		    'customer_id' => $bill->partner,
		    'price_total' => $bill->total_bill,
		    'note'        => $bill->reason ? $bill->reason : 'Bán lẻ',
		    'shipment_id' => 0,
		    'old_debit'   => 0
	    ];
	    $this->load->model( 'bill_model', 'bill' );
	    $this->load->model( 'bill_detail_model', 'bill_detail' );
	    $this->load->model( 'debits_model', 'debits' );
	    if ( isset( $bill->bill_code ) ) {
		    $data_bill['bill_code'] = $bill->bill_code;
	    }
	    if ( isset( $bill->ignor_statistic ) ) {
		    $data_bill['ignor_statistic'] = $bill->ignor_statistic;
	    }
	    if ( isset( $bill->debt ) ) {
		    $data_bill['debit'] = $bill->debt;
		    $checkDebit         = $this->bill->get_customer_debit( $bill->partner );
		    if ( count( $checkDebit ) > 0 ) {
			    #update debit of customer
			    $new_price = (int) $checkDebit->debt + (int) $bill->debt;
			    $this->debits->update( [ 'price' => $new_price ], [ 'customer_id' => $bill->partner, 'type' => 'debit' ] );
		    } else {
			    $this->debits->insert( [
				    'price'       => (int) $bill->debt,
				    'customer_id' => $bill->partner,
				    'type'        => 'debit'
			    ] );
		    }
	    }
	    $bill_id = $this->bill->insert( $data_bill );

	    if ( ! isset( $bill->bill_code ) ) {
		    $code_bill = 'CH' . substr( "00000000{$bill_id}", - 9 );;
		    $this->bill->update( [ 'bill_code' => $code_bill ], [ 'id' => $bill_id ] );
	    }

	    #create bill detail
	    foreach ( $bill->buy_price as $key => $row ) {
		    $bill_detail = [
			    'bill_id'    => $bill_id,
			    'product_id' => $row->product_id,
			    'quantity'   => $row->quantity,
			    'price'      => $row->price
		    ];
		    $this->bill_detail->insert( $bill_detail );
	    }

	    //create bill inventory detail
	    foreach ($bill->buy_price as $product) {
		    $inventories = $this->updateInventoryForSale($product->product_id, $product->quantity);
		    foreach ($inventories as $inv) {
			    $inv['order_id'] = $bill_id;
			    $this->bill->addBillInventory($inv);
		    }
	    }

	    return $bill_id;
    }

	public function updateQuantityBuy($product_id, $quantity)
    {
        $product_buy = $this->product_buy->get_old_product($product_id, 'wholesale');

        if (count($product_buy) > 0) {
            if ($product_buy->remaining_quantity >= $quantity)
                $this->product_buy->update(['remaining_quantity' => ((int)$product_buy->remaining_quantity - (int)$quantity)], ['id' => $product_buy->id]);
            else {
                $this->product_buy->update(['remaining_quantity' => 0], ['id' => $product_buy->id]);
                $remaining = (int)$quantity - (int)$product_buy->remaining_quantity;
                $this->updateQuantityBuy($product_id, $remaining);
            }
        }
    }

    public function updateQuantityWarehouse($product_id, $quantity)
    {
        $product_wholesale = $this->wholesale->get_by_product_id($product_id);
        if (count($product_wholesale) > 0) {
            if ($product_wholesale->quantity >= $quantity) {
                $this->wholesale->update(['quantity' => ((int)$product_wholesale->quantity - (int)$quantity)], ['id' => $product_wholesale->id]);
                return true;
            }
        }
        return false;
    }

    public function createBillAndReturnStore()
    {
        $data = $this->input->json();
        $this->load->model('order_model', 'order');
        $order = $this->order->get_by_id($data->order_id);
        if ($data->debit != '' && isset($data->debit))
            $data->price += $data->debit;
        $data_inset = ['partner' => $order->customer_id, 'total_bill' => $data->price, 'debt' => $data->debit];

        #init array for order detail
        foreach ($order->order_detail as $key => $row) {
            $data_inset['buy_price'][] = (object)['product_id' => $row->product_id,
                'quantity' => $row->quantity,
                'price' => $row->total];
        }
        $this->load->model('bill_model');
        $bill_id = $this->createBill((object)$data_inset, true);
        $new_bill = $this->bill_model->get_by_id($bill_id);
        $this->bill_model->update(['bill_code' => 'CH' . $new_bill->id], ['id' => $new_bill->id]);
        $this->order->update(['delivery' => "1"], ['id' => $data->order_id]);
        $shipment = $this->order->get_array(['shipment_id' => $data->shipment_id, 'delivery' => '0']);
        if (count($shipment) == 0) {
            $this->load->model('shipments_model');
            $this->shipments_model->update(['status' => '3'], ['id' => $data->shipment_id]);
        }
        echo json_encode($bill_id);
    }

	private function updateInventoryForSale($productId, $saleQuantity) {
		$allInventories = $this->wholesale->getAllInventoryOfProduct($productId);
		$alias = $this->wholesale->getInventoryByAlias($productId);
		$allInventories = array_merge($allInventories, $alias);
		$result = [];
		foreach($allInventories as $inventory) {
			if ($inventory->quantity >= $saleQuantity) {
				$newQuant = $inventory->quantity - $saleQuantity;
				$processed = $newQuant > 0? 0 : 1;
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
}