<?php

class Warehouse_retail_model extends MY_model {
    protected $CI;
    protected $table_name = 'warehouse_retail';
    
    public function get_by_product_id($product_id){
        return $this->db->where('product_id', $product_id)
                        ->get($this->table_name)
                        ->row();
    }
    public function get_all() {
        return $this->db->query('select *,
                              (select `name` from products where id = ww.product_id) as `name`,
                              (select `name` from products_sale_price where ww.unit = id) as unit_name,
                              (select `code` from products where ww.product_id = id) as code
                              from warehouse_retail as ww')
                        ->result();
    }

    public function getOddProducts(){
    	$query = 'SELECT p.id, p.name, odd.quantity, p.primary_unit , odd.unit FROM warehouse_odd_product `odd` join products p on odd.product_id = p.id WHERE quantity > 0';
    	return $this->db->query( $query )->result_array();
    }
    
}

