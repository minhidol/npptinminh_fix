<?php

class Warehouse_wholesale_model extends MY_model {
    protected $CI;
    protected $table_name = 'warehouse_wholesale';
    
    public function get_by_product_id($product_id, $warehouseId){
        return $this->db->where('product_id', $product_id)
                        ->where('warehouse_id', $warehouseId)
                        ->get($this->table_name)
                        ->row();
    }
    public function get_all() {
        return $this->db->query('select *,
                                (select `name` from products where id = ww.product_id) as `name`,
                                (select code from products where id = ww.product_id) as code,
                                (select `name` from products_sale_price where ww.unit = id) as unit_name
                                from warehouse_wholesale as ww
                                where ww.quantity > 0')
                        ->result();
    }
    public function get_out_stock(){
        return $this->db->query('select *,quantity as total_quantity,0 as warehouses_id
                                from warehouse_wholesale as ww
                                where quantity < 5')
                        ->result();
    }
    public function get_all_for_warehouses() {
        return $this->db->query('select *,0 as warehouses_id,
                                ("Kho nhà") as warehouses_name,
                                (select `name` from products where id = ww.product_id) as `product_name`,
                                (select `name` from products_sale_price where ww.unit = id) as unit_name
                                from warehouse_wholesale as ww
                                where ww.quantity > 0')
                        ->result();
    }

    public function getInventoryByIds($ids) {
        return $this->db->select('product_id, sum(quantity) as quantity, name')
            ->where('processed', '0')
            ->where_in('product_id', $ids)
            ->group_by('product_id')
            ->get('warehouse_wholesale_view')
            ->result_array();
    }

    public function getInventoryById($id) {
        return $this->db->select('product_id, sum(quantity) as quantity, name')
            ->where('processed', '0')
            ->where('product_id', $id)
            ->get('warehouse_wholesale_view')
            ->row();
    }

    public function getTotalInventoryOfAlias($aliasId) {
        return $this->db->select('alias, sum(quantity) as quantity')
            ->where('processed', '0')
            ->where('alias', $aliasId)
            ->group_by('alias')
            ->get('warehouse_wholesale_view')
            ->row();
    }

    public function getInventoryByAlias($aliasId) {
        return $this->db->where('processed', '0')
            ->where('alias', $aliasId)
            ->where('quantity >', 0)
            ->order_by('date')
            ->get('warehouse_wholesale_view')
            ->result();
    }

    public function getAllInventoryOfProduct($proId) {
        $sql = "SELECT * FROM warehouse_wholesale_view WHERE product_id={$proId} AND processed=0 and quantity > 0 order by `date`";
        return $this->db->query($sql)->result();
    }

    public function selectFirstPriceForSale($productId) {
        $sql = "SELECT * FROM warehouse_wholesale_view WHERE product_id={$productId} AND processed=0 and quantity > 0 order by `date` asc limit 0, 1";
        return $this->db->query($sql)->result();
    }
    public function getOrdersByshipment($shipmentId) {
        return $this->db->query("SELECT od.product_id, sum(od.quantity) as total_quantity FROM `order` as o join `order_detail` as od on o.id=od.order_id where shipment_id={$shipmentId} group by od.product_id")->result_array();
    }
    public function updateInve($id, $newVal, $warehouseId = 0) {
        //assume that each product has it own warehouse, so dont need to input it
        if($warehouseId) {
            $this->db->where('product_id', $id)->where('warehouse_id', $warehouseId)->update($this->table_name, ['quantity' => $newVal]);
        } else {
            $this->db->where('product_id', $id)->update($this->table_name, ['quantity' => $newVal]);
        }
    }

    public function ajustInventory($id, $value) {
        $this->db->query("UPDATE {$this->table_name} SET quantity = quantity + {$value}, processed=0 where id={$id}");
    }
    public function get_all_inventory($warehouseId)
    {
        return $this->db->where('warehouse_id', $warehouseId)->where('processed', 0)->get('warehouse_wholesale_view')->result_array();
    }

    public function addSaleInventory($data) {
        $this->db->insert('order_inventory', $data);
    }

    public function getTotalValue($warehosueId = 0) {
        $sql = "select sum(quantity  *price) as total_value from warehouse_wholesale_view";
        if ($warehosueId) {
            $sql .= " WHERE warehouse_id={$warehosueId}";
        }
        return $this->db->query($sql)->row();
    }

    public function getProductWareHouse($warehouseId) {
    	return $this->db->distinct()->select('product_id')->where('warehouse_id', $warehouseId)->get($this->table_name)->result_array();
    }

    public function getAllProductWarehouse() {
        return $this->db->distinct()->select('product_id, warehouse_id, sum(quantity) as inventory')->group_by('product_id, warehouse_id')->get($this->table_name)->result_array();
    }

    public function getFirstInventory($proId){
        return $this->db->where('product_id', $proId)
            ->where('quantity >', 0)
            ->order_by('id', 'asc')
            ->get('warehouse_wholesale')
            ->row();
    }
}

