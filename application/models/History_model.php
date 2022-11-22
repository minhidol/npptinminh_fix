<?php

class History_model extends MY_model {
	protected $table_name = 'warehouse_history_comment';
	public function get_by_date($date) {
		return $this->db->where(['date' => $date])->get($this->table_name)->result_array();
	}
	public function clear_data_of_date($date) {
		$this->db->delete($this->table_name, array('date' => $date));
	}
}