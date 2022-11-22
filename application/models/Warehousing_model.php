<?php

class Warehousing_model extends MY_model
{
    protected $CI;
    protected $table_name = 'warehousing';

    public function __construct()
    {
        parent::__construct();
        $this->ci = $ci = get_instance();
        $ci->load->model('products_buy_price_model', 'product_buy');
    }

    public function getDebit($id = null)
    {
        $query = $this->db->select('w.*,
                        (select name from customers where id = w.partner_id) as partner_name')
            ->where('debit !=', null)
            ->where('debit !=', 0)
            ->where('debit_paid', 0);
        if ($id) {
            $query->where('partner_id', (int)$id);
        }
        return $query->from($this->table_name . ' as w')
            ->order_by('created', 'asc')
            ->get()
            ->result();
    }

    public function get_all_debit()
    {
        return $this->db->query("SELECT c.*, t.total_debit FROM total_liability AS t LEFT JOIN customers AS c ON t.partner_id=c.id")->result_array();
    }

    public function get_by_id($id)
    {
        $row = parent::get_by_id($id);
        $row->detail = $this->ci->product_buy->get_by_warehousing_id($id);
        return $row;
    }
}

