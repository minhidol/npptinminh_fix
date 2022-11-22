<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Warehouses extends MY_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('warehouses_model','warehouses');
        $this->load->model('products_model','products');
    }
    public function index() {
        $data = $this->warehouses->get_all();
        echo json_encode(array('warehouses' => $data));
    }
    public function getWarehouse($warehouses_id){
        $warehouse = $this->warehouses->get_by_id($warehouses_id);
        echo json_encode(array('warehouse' => $warehouse));
    }
    public function addWarehouse(){
        $warehouse = $this->input->json();
        if ($warehouse->id) {
	        $this->warehouses->update($warehouse, ['id' => $warehouse->id]);
	        $warehouses_id = $warehouse->id;
        } else {
	        $warehouses_id = $this->warehouses->insert( $warehouse );
        }
        echo json_encode($warehouses_id);
    }
    public function getWarehouseStorge(){
        $warehouses_id = $this->input->get('id');
        $this->load->model('warehouses_detail_model','warehouse_detail');
        $this->load->model('products_sale_price_model','products_sale');
        $this->load->model('warehouse_wholesale_model','warehouse_wholesale');
        if($warehouses_id != 0)
            $storge = $this->warehouse_detail->get_warehouse_storge($warehouses_id);
        else
            $storge = $this->warehouse_wholesale->get_all();

        foreach ($storge as $key => $row){
            $storge[$key]->unit = $this->products_sale->get_unit_primary($row->product_id);
            if(isset($row->name))
                $storge[$key]->product_name = $row->name;
        }
        echo json_encode(array('warehouses' => $storge));
    }
    public function getProductOutOfStorge(){
        $this->load->model('warehouses_detail_model','warehouse_detail');
        $this->load->model('warehouse_wholesale_model','wholesale_model');
        $products = $this->warehouse_detail->get_product_out_of_storge();
        $whole = $this->wholesale_model->get_out_stock();
        
        $quantity = array_merge($whole,$products);
        
        $arrange = array();
        foreach ($quantity as $key => $row){
            if(isset($arrange[$row->product_id]))
                $arrange[$row->product_id]['quantity'] += (int)$row->total_quantity;
            else
                $arrange[$row->product_id] = array('product_id' => $row->product_id,'quantity' => (int)$row->total_quantity);
        }

        $products = array();
        $this->load->model('products_model','products');
        foreach ($arrange as $key => $row){
            if($row['quantity'] < 5){
                $product = $this->products->get_by_id($row['product_id']);
                $product->total_quantity = $row['quantity'];
                $products[] = $product;
            }
        }
        
        echo json_encode(array('products' => $products));
    }
    public function getAllWarehouses(){
        $this->load->model('warehouses_detail_model','warehouse_detail');
        $this->load->model('warehouse_wholesale_model','wholesale_model');
        $this->load->model('products_model','products');
        $warehouses = $this->warehouse_detail->get_warehouse_status();
        $whole = $this->wholesale_model->get_all_for_warehouses();
        $warehouses = array_merge($warehouses,$whole); 
        // $products = $this->products->get_array(array('active' => 0));
        $this->load->model('ProductUnitModel', 'ProductUnit');
        $units = $this->ProductUnit->getListReturnArray(array('is_deleted' => 0));
        $products = $this->products->getListReturnArray(array('active' => 0));

        $unitIds = array_column($units, 'id');
        array_combine($unitIds, $units);

        foreach ($products as $key => $product) {
            if(isset($units[$product['sale_unit']]) and $units[$product['sale_unit']]['is_prefix'] == 1) {
                $products[$key]['name'] = "{$units[$product['sale_unit']]['name']} {$products[$key]['name']}";
            }
        }

        echo json_encode(array('warehouses' => $warehouses, 'products' => $products));
    }
    public function deleteWarehouses(){
      $id = $this->input->get('id');
      $warehouses_id = $this->input->get('warehouses_id');
      if($warehouses_id == 0){
        $this->load->model('Warehouse_wholesale_model','warehouse_wholesale');
        $this->warehouse_wholesale->delete(array('id' => $id));
      }else{
        $this->warehouses->delete(array('id' => $id));
      }
      echo 'success';
    }
}

