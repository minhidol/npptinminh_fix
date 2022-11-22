<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Warehouse_wholesale extends MY_Controller
{

    public function __construct()
    {
        parent::__construct();
        $this->load->model('products_model', 'product');
        $this->load->model('products_sale_price_model', 'product_sale');
        $this->load->model('products_buy_price_model', 'product_buy');
        $this->load->model('warehouse_wholesale_model', 'wholesale');
        $this->load->model('bill_model', 'bill');
    }

    public function index()
    {
        $warehouseId = $this->input->get('id');
        if (!$warehouseId) {
            $warehouseId = 1;
        }
        $products = $this->wholesale->get_all_inventory($warehouseId);
        foreach($products as $pro) {
            if (isset($tempProducts[$pro['product_id']])) {
                $tempProducts[$pro['product_id']]['quantity'] += $pro['quantity'];
            } else {
                $tempProducts[$pro['product_id']] = $pro;
            }
        }
        $products = $tempProducts;

        $this->load->model('customers_model', 'customers');

        $soldProduct = $this->db->query("select product_id, sum(quantity) as quan from order_detail join `order` on order_detail.order_id = `order`.id where `order`.status = 2 group by product_id")->result_array();

        $danhSachHangTraThuong = $this->db->query("select id,alias from products where alias is not null and alias <> '' and active=0")->result_array();

        $soldProduct = array_column($soldProduct, 'quan', 'product_id');

        $lstKeys = array_column($danhSachHangTraThuong, 'id');
        $danhSachHangTraThuong = array_combine($lstKeys, $danhSachHangTraThuong);
        $hangtrathuong = [];
        foreach ($danhSachHangTraThuong as $prod) {
            $hangtrathuong[$prod['alias']][] = $prod['id'];
        }

        $primaryProduct = array_filter($products, function ($v) use ($danhSachHangTraThuong) {
            return !isset($danhSachHangTraThuong[$v['product_id']]);
        });

        $productQuantities = array_column($products, 'quantity', 'product_id');
        $keys = array_map(function ($v) {
            return $v['product_id'];
        }, $primaryProduct);
        $primaryProduct = array_combine($keys, $primaryProduct);
        $tempProducts = [];


        $this->load->model('ProductUnitModel');
        $units = $this->ProductUnitModel->getListReturnArray();
        $units = array_column($units, 'name', 'id');

        $exportProduct = [];
        ksort($primaryProduct);

        $this->ProductUnitModel->__set('table_name', 'warehouse_odd_product');
        $odd_products = $this->ProductUnitModel->getListReturnArray();
        $oddkeys = array_column($odd_products, 'product_id');
        $odd_products = array_combine($oddkeys, $odd_products);

        foreach ($primaryProduct as $key => $value) {
            $tempPro = $value;
            $tempPro['danhsachhangtrathuong'] = [];
            $tempPro['inventorynotchange'] = true;
            $sold = isset($soldProduct[$key]) ? $soldProduct[$key] : 0;
            $banTraThuong = 0;
            $trathuong = 0;
            $odd =  [];
            if (isset($odd_products[$key])) {
                $odd = $odd_products[$key];
                $odd['unit'] = isset($units[$odd['unit']])? $units[$odd['unit']] : '';
            }
            if (isset($hangtrathuong[$key])) {
                foreach ($hangtrathuong[$key] as $proid) {
                    if (isset($products[$proid])) {
                        $temptrathuong = $products[$proid];
                        $temptrathuong['sold'] = 0;
                        $temptrathuong['unit_name'] = (isset($temptrathuong['unit']) and isset($units[$temptrathuong['unit']])) ? $units[$temptrathuong['unit']] : '';
                        $temptrathuong['inventorynotchange'] = true;
                        if (isset($soldProduct[$proid])) {
                            $banTraThuong += $soldProduct[$proid];
                            $temptrathuong['sold'] = $soldProduct[$proid];
                        }
                        if (isset($productQuantities[$proid])) {
                            $trathuong += $productQuantities[$proid];
                            $tempPro['quantity'] += $productQuantities[$proid];
                        }
                        $tempPro['danhsachhangtrathuong'][] = $temptrathuong;

                        if (isset($odd_products[$proid])) {
                            if (empty($odd)) {
                                $odd = $odd_products[$proid];
                                $odd['unit'] = isset($units[$odd['unit']])? $units[$odd['unit']] : '';
                            } else {
                                $odd['quantity'] += $odd_products[$proid]['quantity'];
                            }
                        }
                    }
                }
            }
            $tempPro['sold'] = $sold;
            $tempPro['banTraThuong'] = $banTraThuong;
            $tempPro['trathuong'] = $trathuong;
            $tempPro['unit_name'] = (isset($value['unit']) and isset($units[$value['unit']])) ? $units[$value['unit']] : '';
            $tempPro['odd'] = (empty($odd))? '' : " +{$odd['quantity']} ({$odd['unit']})";
            $exportProduct[$key] = $tempPro;
        }

		$this->load->model('Products_type_model', 'ProductType');
        foreach( $exportProduct as $key => $prod) {
        	$currentPro = (array)$this->product->getSingle($prod['product_id']);
        	$type = (array)$this->ProductType->get_by_id($currentPro['product_type']);
	        $exportProduct[$key]['type'] = $type['name'];
	        $exportProduct[$key]['type_id'] = $type['id'];
        }
        usort($exportProduct, function( $a, $b) {
        	return ($a['type'] == $b['type']) ? $a['name'] > $b['name'] : $a['type'] > $b['type'];
        });

        $this->load->model('Warehouses_model');
        $data = [
            'products' => array_values($exportProduct),
            'soldProduct' => $soldProduct,
            'trathuong' => $danhSachHangTraThuong,
            'listwarehouse' => $this->Warehouses_model->get_array(['is_active' => '0'])
        ];

        $data['totalValue'] = $this->wholesale->getTotalValue()->total_value;
        $data['totalValueCurrentWarehouse'] = $this->wholesale->getTotalValue($warehouseId)->total_value;

        echo json_encode($data);
    }

    public function addWholesale()
    {
        $products = $this->product->get_array(['active' => '0']);
        $this->load->model('customers_model', 'customers');
        $customers = $this->customers->get_array([ 'active' => 0]);

        $this->load->model('Warehouses_model');
        $listwarehouse = $this->Warehouses_model->get_array(['is_active' => '0']);
        echo json_encode(['products' => $products, 'customers' => $customers, 'listwarehouse' => $listwarehouse]);
    }

    public function saveAddWholesale()
    {
        $wholesale = $this->input->json();

        $this->db->trans_start();
        #insert warehousing
        $this->load->model('warehousing_model');
        $warehousing_id = $this->warehousing_model->insert(['price' => $wholesale->total_bill,
            'debit' => $wholesale->total_bill - $wholesale->actual,
            'partner_id' => $wholesale->partner]);
        #insert product_buy_price
        $currentdate = date('Y-m-d H:i:s');
        foreach ($wholesale->buy_price as $item => $value) {
            $unit_primary = $this->product_sale->get_unit_primary($value->product_id);
            $buy_list = ['product_id' => $value->product_id,
                'price' => $value->price,
                'unit' => $unit_primary->unit,
                'warehousing_id' => $warehousing_id,
                'quantity' => $value->quantity,
                'remaining_quantity' => $value->quantity,
                'created' => $currentdate,
                'partner' => $wholesale->partner];
            $this->product_buy->insert($buy_list);
            //add inventory
//            $product = $this->wholesale->get_by_product_id($value->product_id, $wholesale->warehouseid);
//            if ($product) {
//                $this->wholesale->update(['quantity' => $product->quantity + $value->quantity], ['product_id' => $value->product_id, 'warehouse_id' => $wholesale->warehouseid]);
//            } else {
            $inventory = ['product_id' => $value->product_id,
                          'quantity' => $value->quantity,
                          'unit' => $unit_primary->unit,
                          'warehouse_id' => $wholesale->warehouseid,
                          'date' => $currentdate,
                          'price' => $value->price
            ];
            $this->wholesale->insert($inventory);
//            }
        }
        $this->db->trans_complete();
        echo json_encode($warehousing_id);
    }

    public function deleteWarehouse($id)
    {
        if ($this->wholesale->delete(['id' => $id]))
            echo json_encode(['status' => 'success']);
        else
            echo json_encode(['status' => 'error']);
    }

    public function updateInventory()
    {
        $data = $this->input->json();
        if ($data->id) {
            $this->wholesale->updateInve($data->product, $data->value, $data->warehouse);
        } else {
            $insertData = [
                'product_id' => $data->product,
                'quantity' => $data->value,
                'warehouse_id' => $data->warehouse
            ];
            $this->wholesale->insert($insertData);
        }
    }

    public function get_sale_data() {
	    $products = $this->wholesale->get_all();
	    $this->load->model('customers_model','customers');
	    $customers = $this->customers->get_array(array('active' => 0));
	    foreach($customers as $key => $row){
		    $customers[$key]->total_debt = $this->bill->get_customer_debit($row->id);
	    }
	    echo json_encode(array('products' => $products,'customers' => $customers));
    }
}