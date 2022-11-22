<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Products extends MY_Controller
{

    public function __construct()
    {
        parent::__construct();
        $this->load->model('products_model', 'product');
        $this->load->model('products_sale_price_model', 'product_sale');
    }

    public function index()
    {
        $this->load->model('products_type_model', 'product_type');
        $this->load->model('products_buy_price_model', 'product_buy');
        $product = $this->product->get_array(['active' => '0']);
        $product_type_all = $this->product_type->get_array(['active' => 0]);
        foreach ($product as $key => $row) {
            //get product type
            $product_type = $this->product_type->get_by_id($row->product_type);
            $product[$key]->sale_price = $this->product_sale->get_by_product_id($row->id);
            $product[$key]->buy_price = $this->product_buy->get_latest_buy_price($row->id);
            if (isset($product_type->name))
                $product[$key]->product_type_name = $product_type->name;
            //cut create date
            $date = explode(' ', $row->created);
            $product[$key]->created = $date[0];
	        $product[$key] = (array)$product[$key];
        }

	    usort($product, function( $a, $b) {
		    return (!isset($a['product_type_name']) || !isset($b['product_type_name']) ||
		        $a['product_type_name'] == $b['product_type_name']
            ) ? $a['name'] > $b['name'] : $a['product_type_name'] > $b['product_type_name'];
	    });
        echo json_encode(['products' => $product, 'product_type' => $product_type_all]);
    }

    public function deleteInvoice($invoice_id)
    {
        $this->load->model('products_buy_price_model', 'product_buy');
        $this->load->model('warehouse_wholesale_model', 'warehouse_wholesale');
        $this->load->model('warehouse_retail_model', 'warehouse_retail');
        $invoice = $this->product_buy->get_by_id($invoice_id);

        #update quantity for warehouse
        switch ($invoice->warehouse) {
            case 'wholesale':
                $product = $this->warehouse_wholesale->get_by_product_id($invoice->product_id);
                $this->warehouse_wholesale->update(['quantity' => (int)$product->quantity - (int)$invoice->quantity], ['id' => $product->id]);
                break;
            default:
                $product = $this->warehouse_retail->get_by_product_id($invoice->product_id);
                $this->warehouse_retail->update(['quantity' => (int)$product->quantity - (int)$invoice->quantity], ['id' => $product->id]);
                break;
        }

        #delete invoice warehouse
        $result = $this->product_buy->delete(['id' => $invoice->id]);
        echo json_encode($result);
    }

    public function deleteProduct()
    {
        $id = $this->input->get('id');
        $this->product->update(['active' => 1], ['id' => $id]);

        #delete product in warehouse wholesale and retail
        $this->load->model('warehouse_retail_model', 'retail');
        $this->load->model('warehouse_wholesale_model', 'wholesale');
        $this->retail->delete(['product_id' => $id]);
        $this->wholesale->delete(['product_id' => $id]);
        echo $id;
    }

    public function checkCode($code)
    {
        $product = $this->product->get_by_code($code);
        if (count($product) == 0)
            echo json_encode(0);
        else
            echo json_encode(1);
    }

    public function createProductView()
    {
        if (isset($_GET['id'])) {
            $product = $this->product->get_by_id($_GET['id']);

        }
        $all_product = $this->product->get_all();
        $this->load->model('products_type_model', 'product_type');
        $product_type = $this->product_type->get_array(['active' => 0]);
        if (isset($product))
            echo json_encode(['products' => $product, 'product_type' => $product_type, 'all_product' => $all_product]);
        else
            echo json_encode(['product_type' => $product_type, 'all_product' => $all_product]);
    }

    public function createProduct()
    {
        $product = $this->input->json(null, true);
        // if(isset($product['alias'])) {
        //     $product_id = $this->product->insertAlias($product);
        // } else {
        $list_price = $product['list_price'];
        unset($product['list_price']);
        $product_id = $this->product->insert($product);
        $sale_id = null;
        foreach ($list_price as $key => $value) {
            $sale_detail = [
                'product_id' => $product_id,
                'parent_id' => $sale_id,
                'price' => str_replace(',','',$value['price']),
                'name' => $value['name'],
                'unit' => $value['unit'],
                'quantity' => $value['quantity']
            ];
            $sale_id = $this->product_sale->insert($sale_detail);
        }
        // }
    }

    public function editProduct()
    {
        $id = $_GET['id'];
        $product = $this->input->json();
        //echo json_encode($product);
        $list_price = $product->list_price;
        foreach ($list_price as $key => $value) {
            if(!isset($value->unit) || $value->unit == null || $value->unit == ''){
                //echo json_encode(['error' => 'Không tồn tại quy cách']);
                // break;
                return;
            }
        }
        unset($product->list_price);
        $this->product->update($product, ['id' => $id]);
        $this->product_sale->delete(['product_id' => $id]);
        $sale_id = null;
        foreach ($list_price as $key => $value) {
                $sale_detail = [
                    'product_id' => $id,
                    'parent_id' => $sale_id,
                    'price' => str_replace(',', '', $value->price),
                    'name' => $value->name,
                    'unit' => $value->unit,
                    'quantity' => $value->quantity
                ];
                $sale_id = $this->product_sale->insert($sale_detail);
        }
        
        // //update unit for buy price, warehouse-wholesale, warehouse-retail
        $this->load->model('products_buy_price_model');
        $this->load->model('warehouse_retail_model');
        $this->load->model('warehouse_wholesale_model');
        $this->load->model('check_use_trigger_model');
        $this->load->model('Warehouses_model', 'warehouse');
        $unit_primay = $this->product_sale->get_unit_primary($id);
        $unit_retail = $this->product_sale->get_unit_retail($id);
        $this->products_buy_price_model->update(['unit' => $unit_primay->id], ['product_id' => $id, 'warehouse' => 'wholesale']);
        $this->products_buy_price_model->update(['unit' => $unit_retail->id], ['product_id' => $id, 'warehouse' => 'retail']);
        $this->warehouse_retail_model->update(['unit' => $unit_retail->id], ['product_id' => $id]);
        $this->check_use_trigger_model->update(['content_update' => 'update_unit'], ['table_name' => 'warehouse_wholesale']);
        $table = $this->warehouse_wholesale_model->update(['unit' => $unit_primay->id], ['product_id' => $id]);
        $this->db->query('call update_date_inventory_not_trigger()');
        $this->check_use_trigger_model->update(['content_update' => ''], ['table_name' => 'warehouse_wholesale']);
    }

    public function getAllWithUnit()
    {
        $this->load->model('ProductUnitModel', 'ProductUnit');
        $this->load->model('Warehouse_wholesale_model', 'warehouseWholesale');
        $data['units'] = $this->ProductUnit->get_array(['is_deleted' => 0]);
        $this->product->__set('table_name', 'product_primary_price_view');
        $data['products'] = $this->product->get_array(['active' => 0]);

        $prodWarehouse = $this->warehouseWholesale->getAllProductWarehouse();
        $data['productwarehouse'] = [];
        foreach ($prodWarehouse as $item ) {
            if( isset($data['productwarehouse'][$item['product_id']] )) {
                $data['productwarehouse'][$item['product_id']]['inv'] += $item['inventory'];
            } else {
                $data['productwarehouse'][$item['product_id']] = ['id' => $item['warehouse_id'], 'inv' => $item['inventory'] ? $item['inventory'] : 0];
            }
        }

        foreach($data['products'] as $pro) {
	        if (strpos(strtolower($pro->name), 'ly') !== false) {
	        	$pro->numbox = 2;
	        } else {
		        $pro->numbox = 1;
	        }

	        if ( isset($data['productwarehouse'][$pro->id]) ) {
	            $pro->warehousid = $data['productwarehouse'][$pro->id]['id'];
	            $pro->inventory = $data['productwarehouse'][$pro->id]['inv'];
            }
	        else {
                $pro->warehousid = 0;
                $pro->inventory = 0;
            }
        }

        echo json_encode($data);
    }

    public function getUnits()
    {
        $this->load->model('ProductUnitModel', 'ProductUnit');
        $units = $this->ProductUnit->get_array(['is_deleted' => 0]);
        echo json_encode($units);
    }

    public function getListProductWithUnitName()
    {
        $this->load->model('ProductUnitModel', 'ProductUnit');
        $units = $this->ProductUnit->get_array(['is_deleted' => 0]);
        $products = $this->product->get_array(['active' => 0]);

        $unitIds = array_column($units, 'id');
        array_combine($unitIds, $units);

        foreach ($products as $key => $product) {
            if (isset($units[$product['sale_unit']]) and $units[$product['sale_unit']]['is_prefix'] == 1) {
                $products[$key]['name'] = "{$units[$product['sale_unit']]['name']} {$products[$key]['name']}";
            }
        }
        echo json_encode($products);
    }

    public function get()
    {
        $id = $this->input->get('i');
        $data['products'] = $this->product->get_by_id($id);
        $this->load->model('ProductUnitModel', 'ProductUnit');
        $units = $this->ProductUnit->getListReturnArray(['is_deleted' => 0], true);
        $keys = array_column($units, 'id');
        $units = array_combine($keys, $units);
        $product_sales = [];
        foreach ($data['products']->sale_price as $key => $value) {
            $product_sales[$value->id] = $value->unit;
        }
        foreach ($data['products']->sale_price as $key => $value) {
            if (isset($value->parent_id)) {
                $data['products']->sale_price[$key]->parent_name = isset($product_sales[$value->parent_id]) ? $units[$product_sales[$value->parent_id]]['name'] : '';
            }
        }
        $this->load->model('warehouse_wholesale_model', 'warehouse_wholesale');
        $this->load->model('warehouses_model');
        $warehouses = $this->warehouses_model->get_all();
        $sortedwarehouses = [];
        foreach ($warehouses as $w) {
            $sortedwarehouses[$w->id] = $w;
        }
        $inventory = $this->warehouse_wholesale->getAllInventoryOfProduct($id);
        foreach ($inventory as $inv) {
            $inventory[$inv->date] = $inv;
        }
        $buy_prices = [];
        foreach ($data['products']->buy_price as $key => $value) {
            if (isset($inventory[$value->created])) {
                $value->remaining_quantity = $inventory[$value->created]->quantity;
                $value->warehouse = isset($sortedwarehouses[$inventory[$value->created]->warehouse_id]) ? $sortedwarehouses[$inventory[$value->created]->warehouse_id]->name : '';
                $buy_prices[] = $value;
            }
        }
        $data['products']->buy_price = $buy_prices;

        echo json_encode($data);
    }

    public function getLastBuyPrice() {
        $this->load->model('Products_buy_price_model');
        $lastPrices = $this->Products_buy_price_model->getLastBuyPrice();

        echo json_encode( array_column($lastPrices, 'lastPrice', 'product_id'));
    }
}
