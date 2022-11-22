<?php
class Debits_model extends MY_model {
  protected $table_name = 'debits';
  private $view_name = 'total_debit';

  public function get_customer_debit($customer_id){
    return $this->db->where('customer_id',$customer_id)
                    ->get($this->table_name)
                    ->row();
  }

  public function get_customer_total_debit($customer_id) {
        return $this->db->where('customer_id', $customer_id)
                       ->get($this->view_name)
                       ->row();
  }

    public function get_all_debit(){
        return $this->db->query("SELECT c.*, t.total_debit FROM {$this->view_name} AS t LEFT JOIN customers AS c ON t.customer_id=c.id")->result_array();
    }
  public function get_all(){
    return $this->db->select();
  }
}