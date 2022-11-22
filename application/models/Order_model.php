<?php

class Order_model extends MY_model {
    protected $table_name = 'order';
    
    public function get_all(){
        return $this->db->query('select *
                                from `'.$this->table_name.'` as o
                                where o.shipment_id is NULL
                                and o.delivery = "0"')
                        ->result();
    }
    public function get_array($where_arr = null,$customer = null) {
        if(!isset($customer))
            $orders = parent::get_array($where_arr);
        else{
            $orders = parent::get_array($where_arr);
            $this->load->model('customers_model','customers');
            $this->load->model('order_status_type_model','order_status');
            foreach ($orders as $key => $row){
                $orders[$key]->customer_detail = $this->customers->get_by_id($row->customer_id);
                $orders[$key]->status = $this->order_status->get_by_id($row->status);
            }
        }
        return $orders;
    }
    public function updatePriceOfOrder($order_id){
        $this->db->query("UPDATE `order` SET total_price = (SELECT sum(total) FROM order_detail WHERE order_id = $order_id) WHERE id = $order_id");
    }
    public function get_by_id($id) {
        $order = parent::get_by_id($id);
        $this->load->model('order_detail_model','order_detail');
        $order->order_detail = $this->order_detail->get_order_detail($id);
        return $order;
    }
    public function getRestOrder($truck_id){
        return $this->db->query('select *,
                                (select `name` from customers where id = o.customer_id) as customer_name,
                                (select address from customers where id = o.customer_id) as customer_address
                                from `'.$this->table_name.'` as o
                                where shipment_id in (select id from shipments where truck_id = '.$truck_id.' and `status` != 3)')
                        ->result();
    }
    public function get_order_detail($order_id){
      $order = parent::get_by_id($order_id);
      $this->load->model('order_detail_model','order_detail');
      $order->order_detail = $this->order_detail->get_order_detail($order_id);
      return $order;
    }

    public function getByShipment($id){
        return $this->db->query('select *,
                                (select `name` from customers where id = o.customer_id) as customer_name,
                                (select `address` from customers where id = o.customer_id) as customer_address,
                                (select `store_name` from customers where id = o.customer_id) as customer_store_name
                                from `'.$this->table_name.'` as o
                                where o.shipment_id ='.$id.'
                                and o.delivery = "0"')
                        ->result_array();
    }

    public function removeShipment($shipment){
        $this->db->where(array('shipment_id' => $shipment))->update($this->table_name,['delivery' => '0', 'shipment_id' =>null]);
    }

    public function xoaShipment($ids){
        $this->db->where_in('id', $ids)->update($this->table_name,['delivery' => '0', 'shipment_id' =>null]);

    }

    public function doiShipment($lstId, $shipment){
        $this->db->where_in('id', $lstId)->update($this->table_name,['delivery' => '0', 'shipment_id' =>$shipment]);

    }

    public function addSaleInventory($data) {
        $this->db->insert('order_inventory', $data);
    }

    public function getSaleInventory($order_id, $isPromotion = '0') {
        return $this->db->where('order_id', $order_id)->where('is_promotion', $isPromotion)->order_by('id', 'desc')->get('order_inventory')->result();
    }

    public function updateLastBillId($shipmentId) {
        $query = "UPDATE `order` SET last_bill=(SELECT max(id) FROM bill) WHERE shipment_id={$shipmentId}";
        $this->db->query($query);
    }

    public function getExportHistory($date) {
	    $from = date('Y-m-d 00:00:00', strtotime($date));
	    $to = date('Y-m-d 23:59:59', strtotime($date));
    	$query = "SELECT od.product_id, od.quantity, o.created, o.shipment_id FROM `order` o JOIN order_detail od ON o.id=od.order_id
WHERE o.status <>2 AND o.created >= '{$from}' AND 0.created <= '{$to}'";
    	return $this->db->query($query)->result_array();
    }

    public function getListNewOrder(){
        return $this->db->where("status", 2)
//            ->group_start()
            ->where('delivery <>', 1)
//            ->or_where('delivery is NULL', null, false)
//            ->group_end()
            ->get($this->table_name)
            ->result();
    }
}
