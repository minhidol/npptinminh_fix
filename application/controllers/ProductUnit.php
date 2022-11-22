<?php
/**
* 
*/
class ProductUnit extends MY_Controller
{
	public function create(){
		$data = $this->input->json();
		$this->load->model('ProductUnitModel');
		$this->ProductUnitModel->insert($data);
	}
	public function update(){
		$data = $this->input->json();
		$this->load->model('ProductUnitModel');
		$this->ProductUnitModel->update(array('name' => $data->name), array('id' => $data->id));		
	}

	public function delete(){
		$data = $this->input->json();
		$this->load->model('ProductUnitModel');
		$this->ProductUnitModel->update(array('is_deleted' => 1), array('id' => $data->id));		
	}
}