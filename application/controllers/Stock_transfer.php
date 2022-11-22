<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Stock_transfer extends MY_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('warehouse_retail_model','retail');
        $this->load->model('products_sale_price_model','sale_price');
        $this->load->model('warehouse_wholesale_model','wholesale');
        $this->load->model('products_model','products');
        $this->load->model('Warehouses_model', 'warehouse');
	    $this->load->model('Bill_model', 'billmodel');
    }
    public function index(){
        $wholesale_products = $this->wholesale->get_all();
        $retail_products = $this->retail->get_all();
        $products = $this->products->get_array(array('active' => 0));
        echo json_encode(array('wholesale_products' => $wholesale_products,
                               'retail_products' => $retail_products,
                               'products' => $products));
    }
    public function doTransfer(){
        $transfer = $this->input->json();
        
        # update quantity in wholesale warehouse 
        $wholesale_product = $this->wholesale->get_by_product_id($transfer->send_product);
        $new_quantity = (int)$wholesale_product->quantity - $transfer->quantity;
        $this->wholesale->update(array('quantity' => $new_quantity),array('product_id' => $wholesale_product->product_id));
        
        #convert quantity from whole to retail
        $transfer->quantity = $this->convertQuantity($transfer->send_product,$transfer->quantity);        
        
        #update quantity in retail warehouse
        $retail_product = $this->retail->get_by_product_id($transfer->recevie_proudct);
        $this->retail->update(array('quantity' => ($transfer->quantity + $retail_product->quantity)),array('product_id' => $retail_product->product_id));
        
        echo json_encode($transfer->quantity);
    }
    public function initWarehousesTransfer(){
        $this->load->model('warehouses_model');
        $warehouses = $this->warehouses_model->get_all();
        array_push($warehouses, array('id' => 0,'name' => 'kho sỉ'));
        echo json_encode(array('warehouses' => $warehouses));
    }
    public function saveWarehouseTransfer(){
        $data = $this->input->json();
        $this->load->model('warehouses_detail_model');
        $this->load->model('export_bill_model');
        $this->load->model('export_detail_model');
        $this->load->model('warehouse_wholesale_model');
        
        #create export bill
        $export_id = $this->export_bill_model->insert(array('warehouse_from' => $data->warehouse_from, 'warehouse_to' => $data->warehouse_to));
        foreach($data->transfer as $key => $row){
            #update product in warehouse form
            if($data->warehouse_from != 0)
                $this->warehouses_detail_model->update(array('quantity' => $row->remaining),array('product_id' => $row->product_id,'warehouses_id' => $data->warehouse_from));
            else
                $this->warehouse_wholesale_model->update(array('quantity' => $row->remaining),array('product_id' => $row->product_id));
            #update product in warehouse to
            if($data->warehouse_to != 0){
                $product = $this->warehouses_detail_model->get_product_storge($row->product_id,$data->warehouse_to);
                if(count($product) > 0)
                    $this->warehouses_detail_model->update(array('quantity' => ((int)$product->quantity + (int)$row->quantity)),array('id' => $product->id));
                else
                    $this->warehouses_detail_model->insert(array('quantity' => ((int)$row->quantity),'warehouses_id' => $data->warehouse_to,'product_id' => $row->product_id));
            }else{
                $product = $this->warehouse_wholesale_model->get_by_product_id($row->product_id);
                if(count($product) > 0)
                    $this->warehouse_wholesale_model->update(array('quantity' => ((int)$product->quantity + (int)$row->quantity)),array('id' => $product->id));
                else
                    $this->warehouse_wholesale_model->insert(array('quantity' => ((int)$row->quantity),'product_id' => $row->product_id));
            }
            #insert export detail
            $this->export_detail_model->insert(array('export_id' => $export_id,'product_id' => $row->product_id, 'quantity' => $row->quantity));
        }
        
        echo json_encode($data);
    }

	public function getExport() {
		$date = $this->input->get( 'date' );
		if ( ! $date ) {
			$date = date( 'Y-m-d' );
		} else {
            $date = date('Y-m-d', strtotime($date));
        }
		if ($date == date( 'Y-m-d' )) {
            $this->load->model('warehousing_history_model','history');
            $this->history->updateDailyInvetory();
        }
		$header = [
			'import' => [],
			'export' => []
		];
		// get startdate inventory
		$tempstartdateinv = $this->warehouse->beginDateInventory( $date );
		$startdateinv     = [];
		foreach ( $tempstartdateinv as $item ) {
			$startdateinv[ $item->product_id ] = $item;
		}

		// get enddate inventory - from inventory history or current warehouse inventory
		$tempenddateinvas = $this->warehouse->historyInventory( $date );
		$enddateinv       = [];
		$warehouseId = $this->input->get( 'wid', true );
		if ( empty( $warehouseId ) ) {
			$warehouseId = 1;
		}
		$productsInWarehouse = $this->wholesale->getProductWareHouse( $warehouseId );
		$productsInWarehouse = array_column( $productsInWarehouse, 'product_id', 'product_id' );

		foreach ( $tempenddateinvas as $eitem ) {
			$enddateinv[ $eitem->product_id ] = $eitem;
		}
		$import    = [];
		$lstimport = $this->warehouse->getImportHistory( $date );
		foreach ( $lstimport as $key => $value ) {
			if ( !isset( $productsInWarehouse[$value->product_id] ) ) continue;
			$time = date( 'H:i:s', strtotime( $value->created ) );
			if ( isset( $import[ $value->product_id ] ) && isset( $import[ $value->product_id ][ $time ] ) ) {
				$import[ $value->product_id ][ $time ]->quantity += $value->quantity;
			} else {
				$import[ $value->product_id ][ $time ] = $value;
			}
			if ( ! in_array( $time, $header['import'] ) ) {
				$header['import'][ $time ] = $time;
			}
		}

		// get return product
		$returned = [];

		// get export product
		$lstexport  = $this->billmodel->getExportHistory( $date );
		$exported   = [];
		$derectsale = [];
		$this->load->model( 'Customers_model', 'Customer' );

		foreach ( $lstexport as $key => $value ) {
			if ( ! isset( $productsInWarehouse[ $value['product_id'] ] ) ) {
				continue;
			}

			$time = date( 'H:i:s', strtotime( $value['date'] ) );

			if ( $value['shipment_id'] ) {
				if ( isset( $exported[ $value['product_id'] ] ) && isset( $exported[ $value['product_id'] ][ $value['shipment_id'] ] ) ) {
					$exported[ $value['product_id'] ][ $value['shipment_id'] ]['quantity'] += $value['quantity'];
				} else {
					$exported[ $value['product_id'] ][ $value['shipment_id'] ] = $value;
				}
				if ( ! isset( $header['export'][ $value['shipment_id'] ] ) ) {
					$header['export'][ $value['shipment_id'] ] = [
						'index' => $value['index'],
						'truck' => $value['truck_name'],
//						'link' => '/index.php/dashboard#/bill-detail/wholesale/' . $value['id'],
					];
				}
			} else {
				if( isset($derectsale[ $value['product_id'] ][ $time ])) {
					$derectsale[ $value['product_id'] ][ $time ]['quantity'] += $value['quantity'];
				} else {
					$derectsale[ $value['product_id'] ][ $time ] = $value;
				}
				if ( !isset( $header['directsale'] ) || !isset( $header['directsale'][$time] ) ) {
					$customer         = $this->Customer->get_by_id( $value['customer_id'] );
					$directSaleDetail = "";
					if ( ! empty( $customer ) ) {
						$directSaleDetail = "{$customer->name}<br/>{$customer->address}";
					}
					$header['directsale'][ $time ] = [
						'time' => $time,
						'detail' => $directSaleDetail,
						'link' => '/index.php/dashboard#/bill-detail/wholesale/' . $value['id']
					];
				}
			}
			if ( isset( $returned[ $value['product_id'] ] ) ) {
				$returned[ $value['product_id'] ] += $value['returned'];
			} else {
				$returned[ $value['product_id'] ] = $value['returned'];
			}
		}

		$this->load->model( 'History_model' );
		$tempdeviation = $this->History_model->get_by_date( $date );
		$deviation     = [];
		foreach ( $tempdeviation as $derow ) {
			$deviation[ $derow['product_id'] ] = $derow;
		}

		$returndata = [
			'header' => $header,
			'data'   => [],
			'date'   => $date
		];
		$this->load->model('Products_type_model', 'ProductType');

		$exportData = [];

        $totalValueCurrentWarehouse = 0;
        $totalValue = 0;

        foreach ( $enddateinv as $proid => $value ) {
            $totalValue += $value->total_value;
			if ( ! isset( $productsInWarehouse[ $proid ] ) ) {
				continue;
			}
			$product              = $this->products->getSingle( $proid );
			$type = (array)$this->ProductType->get_by_id($product->product_type);
			$data                 = [
				'product_id'   => $proid,
				'name'         => $product->name,
				'type'=> empty($type['name'])? '' : $type['name'],
				'type_id' => empty($type['id'])? '' : $type['id'],
				'startdateinv' => isset( $startdateinv[ $proid ] ) ? $startdateinv[ $proid ] : 0,
				'import'       => isset( $import[ $proid ] ) ? $import[ $proid ] : [],
				'returned'     => isset( $returned[ $proid ] ) ? $returned[ $proid ] : 0,
				'export'       => isset( $exported[ $proid ] ) ? $exported[ $proid ] : [],
				'directsale'   => isset( $derectsale[ $proid ] ) ? $derectsale[ $proid ] : [],
				'enddateinv'   => $value,
				'deviation'    => isset( $deviation[ $proid ] ) ? $deviation[ $proid ] : [ 'manual_end_date' => 0, 'deviation' => 0 ]
			];
			$totalValueCurrentWarehouse += $value->total_value;
			$exportData[] = $data;
		}

		// sort
		usort($exportData, function( $a, $b) {
			return ($a['type'] == $b['type']) ? $a['name'] > $b['name'] : $a['type'] > $b['type'];
		});
		$returndata['data'] = $exportData;
		$returndata['totalValueCurrentWarehouse'] = $totalValueCurrentWarehouse;
		$returndata['totalValue'] = $totalValue;
		echo json_encode( $returndata );
	}

	public function saveData() {
        $data = $this->input->json('data');
        $date = $data->date;
        $data = $data->data;
        if (!empty($data)) {
        	$date = date('Y-m-d H:i:s', strtotime($date));
	        $this->load->model('History_model');
	        $this->History_model->clear_data_of_date($date);
	        foreach ($data as $row) {
	        	$insertdata = array(
	        		'product_id' => $row->id,
			        'manual_end_date' => $row->value,
			        'date' => $date
		        );

	        	$this->History_model->insert($insertdata);
	        }
        }
    }

    public function getExportDetail(){
        $id = $this->input->get('id');
        $this->load->model('export_bill_model');
        $export = $this->export_bill_model->get_by_id($id);
        echo json_encode(array('exports' => $export));
    }
    public function addProductToRetail(){
        $transfer = $this->input->json();
        
        # update quantity in wholesale warehouse 
        $wholesale_product = $this->wholesale->get_by_product_id($transfer->send_product);
        $new_quantity = (int)$wholesale_product->quantity - $transfer->quantity;
        $this->wholesale->update(array('quantity' => $new_quantity),array('product_id' => $wholesale_product->product_id));
        
        #convert quantity
        $transfer->quantity = $this->convertQuantity($transfer->send_product,$transfer->quantity);
        
        #add product to retail warehouse
        $unit = $this->sale_price->get_by_product_id($transfer->recevie_proudct);
        
        if(count($unit) == 1){
            $this->retail->insert(array('quantity' => $transfer->quantity,
                                        'product_id' => $transfer->recevie_proudct,
                                        'unit' => $unit[0]->id));
        }
        echo json_encode($transfer);
    }
    public function convertQuantity($send_product,$quantity){
        $sale_price = $this->sale_price->get_by_product_id($send_product);
        foreach($sale_price as $key => $row){
            $quantity *= (int)$row->quantity;
        }
        return $quantity;
    }
}
