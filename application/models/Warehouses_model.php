<?php

class Warehouses_model extends MY_model {
	protected $CI;
	protected $table_name = 'warehouses';

	function getInventory( $proid ) {
		$product = $this->db->select( 'quantity' )
		                    ->where( 'product_id', $proid )
		                    ->get( 'warehouse_wholesale' )
		                    ->row();

		return $product ? $product->quantity : 0;
	}

	function getOddInventory( $product ) {
		return $this->db->where( [ 'product_id' => $product] )->get( 'warehouse_odd_product' )->row();
	}

	function updateOddInventory( $id, $quantity ) {
		$this->db->update( 'warehouse_odd_product', [ 'quantity' => $quantity ], [ 'product_id' => $id ] );
	}

	public function historyInventory( $date = null ) {
		if (!$date) {
			$date = date('Y-m-d');
		}
		$query = "SELECT * FROM inventory_history where `date`=(select max(`date`) from inventory_history where `date` <= '{$date}');";
		return $this->db->query($query)->result();
	}

	public function beginDateInventory( $date = null ) {
		if (!$date) {
			$date = date('Y-m-d');
		}

		$query = "SELECT * FROM inventory_history where `date`=(select max(`date`) from inventory_history where `date` < '{$date}');";
		return $this->db->query($query)->result();
	}

	public function getImportHistory($date) {
		$from = date('Y-m-d 00:00:00', strtotime($date));
		$to = date('Y-m-d 23:59:59', strtotime($date));
		$query = "SELECT * FROM products_buy_price WHERE created >= '{$from}' AND created <= '{$to}' ORDER BY created ASC";
		return $this->db->query($query)->result();
	}

    public function getTotalInventoryValue($date) {
        return $this->db->select_sum("total_value")->where(['date' => $date])->get('inventory_history')->row()->total_value;
    }
}