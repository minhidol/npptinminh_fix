<?php

class Products_buy_price_model extends MY_model {
    protected $CI;
    protected $table_name = 'products_buy_price';
    
    public function get_by_product_id($product_id,$order = null){
        $product =  $this->db->where('product_id', $product_id)
                             ->where('remaining_quantity >','0');
        if($order)
            $product->order_by('price','desc');

        return $product->get($this->table_name)
                        ->result();
    }
    public function get_old_product($product_id, $warehouse_type){
        return $this->db->where('product_id',$product_id)
                        ->where('warehouse', $warehouse_type)
                        ->where('remaining_quantity > 0')
                        ->order_by('created')
                        ->get($this->table_name)
                        ->row();
    }
    public function get_new_product($product_id){
        return $this->db->where('product_id',$product_id)
                        ->where('remaining_quantity > 0')
                        ->order_by('created','desc')
                        ->get($this->table_name)
                        ->row();
    }

    public function get_latest_buy_price($product_id) {
        return $this->db->where('product_id',$product_id)
            ->order_by('id','desc')
            ->get($this->table_name)
            ->row();
    }
    // public function get_array($type,$id){
    //     return $this->db->where($type,$id)
    //                     ->get($this->table_name)
    //                     ->result();
    // }
    public function get_by_warehousing_id($warehousing_id){
//        return $this->db->query('select *,
//                                (select `name` from products where id = pb.product_id) as product_name,
//                                (select `name` from products_sale_price where id = pb.unit) as unit_name
//                                from products_buy_price as pb
//                                where warehousing_id = '.$warehousing_id)
//                        ->result();

        return $this->db->query("select pp.*, pf.name as product_name, pf.unit_name, pf.unit_id
                                    FROM products_buy_price pp
                                        left join (
                                            select p.id, p.name, pu.name as unit_name, pu.id as unit_id
                                            from products p
                                            left join product_unit pu on p.primary_unit = pu.id) `pf` 
                                            on pp.product_id = pf.id 
                                    WHERE pp.warehousing_id=" . ((int)$warehousing_id))->result();
    }

    public function getLastBuyPrice() {
        return $this->db->query("SELECT product_id, substring_index(GROUP_CONCAT( if(price is null, 0, price) order by id desc), ',' ,1) as lastPrice FROM `products_buy_price` group by product_id")
            ->result_array();
    }
}

