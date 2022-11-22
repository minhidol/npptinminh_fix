<?php
/**
* 
*/
class MetaPromotion extends MY_Model
{
	
	function __construct()
	{
		$this->table_name = 'meta_promotion';
	}
	public function searchForOrderAmount($date, $amount) {
		$this->db->where("`start_date` <= '{$date}' AND `end_date` >= '{$date}' AND `receipt_amout` > 0 AND `receipt_amout` <= {$amount}");
		return $this->db->get($this->table_name)->result_array();
	}
	public function searchForOrderProduct($date, $productId, $productQuantity) {
		$this->db->where("`start_date` <= '{$date}' AND `end_date` >= '{$date}' AND (`product_id` = {$productId} AND (`product_number` = 0 OR `product_number` <= {$productQuantity}))");
		return $this->db->get($this->table_name)->result_array();
	}
}