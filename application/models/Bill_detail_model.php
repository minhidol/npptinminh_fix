<?php

class Bill_detail_model extends MY_model
{
    protected $CI;
    protected $table_name = 'bill_detail';

    public function get_by_bill_id($bill_id)
    {
        $query = "SELECT  `b`.`id` AS `id`,  `b`.`bill_id` AS `billbill_detail_id`, `b`.`product_id` AS `product_id`,
        `b`.`quantity` AS `quantity`, `b`.`price` AS `price`, `p`.`name` AS `product_name`, `u`.`name` AS `unit_name`
        FROM ((`bill_detail` `b`
        LEFT JOIN `products` `p` ON ((`b`.`product_id` = `p`.`id`)))
        LEFT JOIN `product_unit` `u` ON ((`p`.`primary_unit` = `u`.`id`)))
        WHERE b.bill_id=" . $bill_id;

        return $this->db->query($query)
            ->result();
    }

    public function getDetailbyProductAndBill($bill_id, $product_id)
    {
        return $this->db->where('bill_id', (int)$bill_id)
            ->where('product_id', $product_id)
            ->get($this->table_name)
            ->row();
    }

    public function get_bill_detail($where_in)
    {
        return $this->db->query('select od.*, p.name as product_name, p.`index`
                                from ' . $this->table_name . ' as od 
                                LEFT JOIN products as p ON p.id=od.product_id
                                where bill_id in (' . $where_in . ') ORDER BY product_id')
            ->result();
    }
}