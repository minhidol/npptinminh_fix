<?php
/**
* 
*/
class ProductUnitModel extends My_Model
{
	
	function __construct()
	{
		$this->table_name = 'product_unit';
	}

	function getConvertRate($product, $unit) {
	    return $this->db->where(['product_id' => $product, 'unit' => $unit])->get('products_sale_price')->row();
    }
}