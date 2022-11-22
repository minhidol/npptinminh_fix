<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Warehouse_retail extends MY_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('products_model', 'product');
        $this->load->model('products_sale_price_model', 'product_sale');
        $this->load->model('products_buy_price_model', 'product_buy');
        $this->load->model('warehouse_retail_model', 'retail');
        $this->load->model('bill_model', 'bill');
    }

    public function index() {
        $products = $this->retail->getOddProducts();

        $this->load->model('ProductUnitModel');
        $units = $this->ProductUnitModel->get_all();
	    $units = array_column($units, 'name', 'id');

	    foreach( $products as $index => $prod ) {
	    	if (isset($units[$prod['unit']])) {
			    $products[$index]['unit_display'] = $units[$prod['unit']];
		    }
		    if (isset($units[$prod['primary_unit']])) {
			    $products[$index]['primary_unit_display'] = $units[$prod['primary_unit']];
		    }
		    $products[$index]['price'] = 0;
	    }
        $this->load->model('customers_model','customers');
        $customers = $this->customers->get_array(array('type' => 'customer','active' => 0));
        foreach($customers as $key => $row){
            $customers[$key]->total_debt = $this->bill->get_customer_debit($row->id);
        }
        echo json_encode(array('products' => $products,'customers' => $customers));
    }
    public function deleteWarehouse($id){
      if($this->retail->delete(array('id' => $id)))
        echo json_encode(array('status' => 'success'));
      else
        echo json_encode(array('status' => 'error'));
    }

    public function addRetail() {
        $products = $this->product->get_all();
        echo json_encode(array('products' => $products));
    }

    public function saveAddRetail() {
        $retail = $this->input->json();

        #insert product_buy_price
        foreach ($retail->buy_price as $item => $value) {

            $this->load->library('convert_unit');
            $quantity = $this->convert_unit->convert_quantity($value->unit,$value->quantity);
            $buy_list = array('product_id' => $value->product_id,
                'price' => $value->price,
                'warehouse' => 'retail',
                'unit' => $value->unit,
                'quantity' => $quantity,
                'remaining_quantity' => $value->quantity,
                'partner' => $retail->partner);
            $this->product_buy->insert($buy_list);

            #insert or update quantity
            $retail_product = $this->retail->get_by_product_id($value->product_id);

            if (count($retail_product) > 0) {
                $retail_list = array('quantity' => ((int) $quantity + (int) $retail_product->quantity));
                $this->retail->update($retail_list, array('product_id' => $value->product_id));
            } else {
                $retail_list = array('quantity' => $value->quantity,
                    'unit' => $value->unit,
                    'product_id' => $value->product_id);
                $this->retail->insert($retail_list);
            }
        }
        echo json_encode($retail);
    }

	public function createBill() {
		$bill = $this->input->json();

		#create bill
		$data_bill = [
			'customer_id' => $bill->partner,
			'price_total' => $bill->total_bill,
			'note'        => $bill->reason ? $bill->reason : 'Bán lẻ',
			'shipment_id' => 0,
			'old_debit'   => 0,
			'debit'       => 0,
		];
		$this->load->model( 'bill_model', 'bill' );
		$this->load->model( 'bill_detail_model', 'bill_detail' );
		$this->load->model( 'Warehousing_history_model', 'WarehousingHistory' );

		$bill_id = $this->bill->insert( $data_bill );

		if ( ! isset( $bill->bill_code ) ) {
			$code_bill = 'CH' . substr( "00000000{$bill_id}", - 9 );;
			$this->bill->update( [ 'bill_code' => $code_bill ], [ 'id' => $bill_id ] );
		}

		#create bill detail
		foreach ( $bill->buy_price as $key => $row ) {
		    if ( $row->quantity > 0 ) {
                $bill_detail = [
                    'bill_id' => $bill_id,
                    'product_id' => $row->product_id,
                    'odd_quantity' => $row->quantity,
                    'price' => $row->price
                ];
                $this->bill_detail->insert($bill_detail);
            }
		}

		//Update odd product
        $this->load->model('Warehouses_model');
		foreach ($bill->buy_price as $product) {
            $oddInv = $this->Warehouses_model->getOddInventory($product->product_id);
            $newQuantity = $product->quantity > $oddInv->quantity ? 0 : $oddInv->quantity - $product->quantity;
            $this->Warehouses_model->updateOddInventory($product->product_id, $newQuantity);
		}

		return $bill_id;
	}

}
