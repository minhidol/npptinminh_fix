<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Customers extends MY_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->model('customers_model','customers');
    }
    public function index() {
        $type = $this->input->get('type');
        $customers = $this->customers->get_all_customer_by_type($type);
        echo json_encode(array('customers' => $customers));
    }
    public function createCustomer(){
        $customer = $this->input->json();
        $customer->phone_home = json_encode($customer->phone_home);
        $customer->phone_mobile = json_encode($customer->phone_mobile);
        $customer_id = $this->customers->insert($customer);
        echo json_encode($customer_id);
    }
    public function getCustomer(){
        $customer_id = $this->input->get('id');
        $customer = $this->customers->get_by_id($customer_id);
        $customer->phone_home = json_decode($customer->phone_home);
        $customer->phone_mobile = json_decode($customer->phone_mobile);
        echo json_encode(array('customer' => $customer));
    }
    public function editCustomer(){
        $this->checkAllowAccess(ROLE_ADMIN);
        $id = $this->input->get('id');
        $customer = $this->input->json();
        $customer->phone_home = json_encode($customer->phone_home);
        $customer->phone_mobile = json_encode($customer->phone_mobile);
        $this->customers->update($customer, array('id' => $id));
    }
    public function deleteCustomer(){
        $this->checkAllowAccess(ROLE_ADMIN);
        $id = $this->input->get('id');
        $this->customers->update(array('active' => '1'), array('id' => $id));
        echo $id;
    }
    
    public function getAll(){
        $this->customers->__set('table_name', 'customer_view');
        $data = $this->customers->get_array(array('active' => 0));
        $this->load->model('bill_model', 'bill');
        foreach ($data as $key => $row) {
          $data[$key]->total_debt = $this->bill->get_customer_debit($row->id);
      }
      echo json_encode($data);
  }
}
?>
