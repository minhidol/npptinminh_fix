<?php
/**
* 
*/
class Promotion extends MY_Controller
{
	public function create(){
        $this->checkAllowAccess(ROLE_ADMIN);
		$data = $this->input->json(null, true);
		$meta = $data['meta'];
		$meta['last_updated'] = date('Y-m-d H:i:s');

		$details = $data['details'];

		$this->load->model('MetaPromotion');
		$this->load->model('PromotionDetail');

		$this->db->trans_begin();
		$newId = $this->MetaPromotion->insert($meta);
		foreach ($details as $detail) {
			unset($detail['id']);
			$detail['meta_id'] = $newId;
			$detail['is_deleted'] = 0;
			$this->PromotionDetail->insert($detail);
		}

		if ($this->db->trans_status() === FALSE)
		{
			$this->db->trans_rollback();
			echo 'error';
		}
		else
		{
			$this->db->trans_commit();
			echo 'success';
		}
	}

	public function get()
	{
		$this->load->model('MetaPromotion');
		$this->load->model('PromotionDetail');

		$id = $this->input->get('i');
		$data['meta'] = $this->MetaPromotion->get_by_id($id);
		$data['details'] = $this->PromotionDetail->get_array(array('meta_id' => $id, 'is_deleted' => 0));

		echo json_encode($data);
	}

	public function update(){
        $this->checkAllowAccess(ROLE_ADMIN);
		$id = $this->input->get('i');

		$data = $this->input->json(null, true);
		$meta = $data['meta'];
		$meta['last_updated'] = date('Y-m-d H:i:s');

		$details = $data['details'];

		$this->load->model('MetaPromotion');
		$this->load->model('PromotionDetail');

		$this->db->trans_begin();
		$this->MetaPromotion->update($meta, array('id' => $id));

		//delete toan bo khuyen mai cu
		$this->PromotionDetail->update(array('is_deleted' => 1), array('meta_id' => $id));		

		foreach ($details as $detail) {
			$detailId = $detail['id'];
			unset($detail['id']);
			$detail['meta_id'] = $id;
			$detail['is_deleted'] = 0;
			if(!empty($detailId)){
				$this->PromotionDetail->update($detail, array('id' => $detailId));
			}
			else {
				$this->PromotionDetail->insert($detail);
			}
		}

		if ($this->db->trans_status() === FALSE)
		{
			$this->db->trans_rollback();
			echo 'error';
		}
		else
		{
			$this->db->trans_commit();
			echo 'success';
		}
	}

	public function delete() {
        $this->checkAllowAccess(ROLE_ADMIN);
		$objJson = $this->input->json(null, true);
		if(isset($objJson['id'])) {
			$this->load->model('MetaPromotion');
			$this->MetaPromotion->update(array('is_deleted' => 1), array('id' => $objJson['id']));
		}
	}

	public function deleteDetail() {
        $this->checkAllowAccess(ROLE_ADMIN);
		$objJson = $this->input->json(null, true);
		if(isset($objJson['meta_id'])) {
			$detailIds = implode(',', $objJson['deletedItem']);
			$this->load->model('PromotionDetail');
			$whereClause = "`meta_id`={$objJson['meta_id']} and id in ({$detailIds})";
			$this->PromotionDetail->update(array('is_deleted' => 1), $whereClause);
			echo $this->db->last_query();
		}
	}

	public function getList(){
		$this->load->model('MetaPromotion');
		$data = $this->MetaPromotion->get_array(array('is_deleted' => 0));
		foreach ($data as $key => $value) {
			$now = date('Y-m-d');
			if($value->start_date > $now) {
				$data[$key]->{'trangthai'} = 'Chưa chạy';
			} elseif($value->end_date < $now) {
				$data[$key]->{'trangthai'} = 'Đã kết thúc';
			} else {
				$data[$key]->{'trangthai'} = 'Đang chạy';
			}
		}

		echo json_encode($data);
	}

	public function getByOrder(){
		$objJson = $this->input->json(null, true);
		$today = date('Y-m-d');

		$this->load->model('MetaPromotion', 'Promotion');
		$this->Promotion->__set('table_name', 'promotion_view');

		$promotionValue = $this->Promotion->searchForOrderAmount($today, $objJson['totalValue']);
		$promotionValue = $this->groupPromotionByMeta($promotionValue);

        $filteredPromotions = [];
		foreach ($promotionValue as $key => $value) {
			$promotionValue[$key] = $this->sortPromotion($value);
			$filteredPromotions[$key]= $this->filterPromotion($objJson['totalValue'], $value);
		}

		foreach ($objJson['detail'] as $product) {
			if ( empty($product['id']) ) continue;
			if (!isset($product['quantity'])) $product['quantity'] = 0;
			$tempPromotion = $this->Promotion->searchForOrderProduct($today, $product['id'], $product['quantity']);
			$tempPromotion = $this->groupPromotionByMeta($tempPromotion);
			$filtered = [];
			foreach ($tempPromotion as $key => $value) {
				$tempPromotion[$key] = $this->sortPromotion($value);
				$filtered[$key]= $this->filterPromotion($product['quantity'], $value, true);
			}
			// $tempPromotion = $this->sortPromotion($tempPromotion, true);
			// $filtered = $this->filterPromotion($product['quantity'], $tempPromotion, true);
			// var_dump($filteredPromotions, $filtered);
			$filteredPromotions = $this->mergePromotion($filteredPromotions, $filtered);
			// var_dump($filteredPromotions);exit;
		}
		// $filteredPromotions = $this->groupPromotionByMeta($filteredPromotions);
		$finalList = [];
		foreach ($filteredPromotions as $key => $lstPromotion) {
			$lstPromotion = $this->filterLargestPercentPromotion($lstPromotion);
			$finalList[] = $lstPromotion;
		}

		echo json_encode($finalList);
	}

	private function filterPromotion($targetValue, $lstPromotion, $isQuantity = false) {
		if(empty($lstPromotion)){
			return [];
		}

		$largest = array_pop($lstPromotion);
		$largestValue = $isQuantity? $largest['product_number'] : $largest['receipt_amout'];
		if($targetValue < $largestValue || $largestValue == 0) {
			return $this->filterPromotion($targetValue, $lstPromotion);
		}
		else {
			$quantity = floor($targetValue / $largestValue);
			$targetValue = $targetValue % $largestValue;
			$result = $this->filterPromotion($targetValue, $lstPromotion);
			array_push($result, array('quantity' => $quantity, 'data'=> $largest));
			return $result;
		}
	}

	private function sortPromotion($lstPromotion, $sortByQuantity = false){
		usort($lstPromotion, function($leftValue, $rightValue) use ($sortByQuantity) {
			if($sortByQuantity) {
				return $leftValue['product_number'] > $rightValue['product_number'];
			}
			else {
				return $leftValue['receipt_amout'] > $rightValue['receipt_amout'];
			}
		});

		return $lstPromotion;
	}

	private function groupPromotionByMeta($lstPromotion) {
		$result = [];
		foreach ($lstPromotion as $promotion) {
			$result[$promotion['meta_id']][] = $promotion;
		}

		return $result;
	}

	private function filterLargestPercentPromotion($lstPromotion) {
		$maxPercent = [];
		$result = [];
		foreach ($lstPromotion as $key => $promotion) {
			if($promotion['data']['percent_discount'] > 0) {
				if(empty($maxPercent) OR $promotion['data']['percent_discount'] > $maxPercent['data']['percent_discount']) {
					$maxPercent = $promotion;
				}
			}
			else {
				$result[] = $promotion;
			}
		}
		if(!empty($maxPercent)){
			$maxPercent['quantity'] = 1;
			array_push($result, $maxPercent);
		} 
		return $result;
	}

	private function mergePromotion($arr1, $arr2) {
		foreach ($arr2 as $key => $pro) {
			if(isset($arr1[$key])) {
				foreach($pro as $value) {
					array_push($arr1[$key], $value);
				}
			}
			else{
				$arr1[$key] = $pro;
			}
		}

		return $arr1;
	}
}