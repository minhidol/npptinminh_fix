<?php

class Bill_model extends MY_model
{
    protected $CI;
    protected $table_name = 'bill';
    protected $view_name = 'bill_with_shipment_view';

    public function __construct()
    {
        parent::__construct();
        $this->ci = $ci = get_instance();
        $ci->load->model('bill_detail_model', 'bill_detail');

    }

    public function get_all_by_type($type)
    {
        $bills = $this->db->select('*,
                                    (select `name` from customers where id = ' . $this->table_name . '.customer_id) as customer_name')
            ->where('warehouse', $type)
            ->order_by('created', 'decs')
            ->get($this->table_name)
            ->result();
        if (count($bills) > 0) {
            foreach ($bills as $key => $row) {
                $date = explode(' ', $row->created);
                $bills[$key]->created = $date[0];
            }
            return $bills;
        } else
            return $bills;
    }

    public function get_by_id($id)
    {
        $bill = parent::get_by_id($id);
        $bill->detail = $this->ci->bill_detail->get_by_bill_id($id);
        $i = 1;
        foreach ($bill->detail as $key => $row) {
            $bill->detail[$key]->stt = $i;
            $i++;
        }
        return $bill;
    }

    public function getDebit($id = null)
    {
        $query = $this->db->select('*,
                                 (select `name` from customers where id = ' . $this->table_name . '.customer_id) as customer_name')
            ->where('debit !=', null)
            ->where('debit !=', 0)
            ->where('ignor_debit', '0');
        if ($id) {
            $query->where('customer_id', (int)$id);
        }
        return $query->order_by('created', 'asc')
            ->get($this->table_name)
            ->result();
    }

    public function get_customer_debit($customer_id)
    {
        return $this->db->select('sum(debit) as debt')
            ->where('customer_id', $customer_id)
            ->where('debit is not null')
            ->where('ignor_debit', '0')
            ->get($this->table_name)
            ->row();
    }

    public function getLastBill()
    {
        $bill = $this->db->order_by('id', 'desc')
            ->limit(1)
            ->get($this->table_name)
            ->row();

        $bill_detail = $this->db->where('bill_id', (int)$bill->id)
            ->get('bill_detail')
            ->result();

        return $bill_detail;
    }

    public function getCustomerDebit($id)
    {
        return $this->db->select_sum('debit')
            ->where('customer_id', $id)
            ->where('debit !=', null)
            ->where('debit !=', 0)
            ->where('ignor_debit', '0')
            ->get($this->table_name)->row();
    }

    public function getWithTruck($condition, $search = '', $fromdate = null, $todate = null)
    {
        if ($fromdate) {
            $query = $this->db->where('created >=', $fromdate)->where('created <=', $todate)->where($condition);
        } else {
            $query = $this->db->where($condition);
        }

        if (!empty($search)) {
            $query->group_start()
                ->like('customer_name', $search, 'both')
                ->or_like('customer_address', $search, 'both')
                ->group_end();
        }

        return $query->get($this->view_name)->result();
    }

    public function salesStatistic($from, $to)
    {
        $sql = "select bd.product_id as proid, sum(bd.quantity) as sum_quan, bd.price, p.name as product_name
                  from (bill_detail as bd inner join bill as b on bd.bill_id = b.id) left join products as p on bd.product_id = p.id
                  where b.created >= '$from' and b.created <= '$to' and b.ignor_statistic = 0
                  group by proid, price";
        return $this->db->query($sql)->result();
    }

    public function getCostByBills($from, $to)
    {
        $sql = "select bi.product_id, sum(bi.quantity * bi.buy_price) as total_value 
               from bill_inventory as bi left join bill as b on b.id=bi.order_id  
               where b.created >= '$from' and b.created <= '$to' and b.ignor_statistic = 0 
               group by product_id";
        return $this->db->query($sql)->result('array');
    }

    public function salesStatisticBillList($from, $to, $productId, $price)
    {
        if ( !$price ) {
            $wherePrice = "(bd.price = 0 or bd.price is null)";
        } else {
            $wherePrice = "bd.price = {$price}";
        }
        $sql = "select b.*, cus.name as customer_name   
                  from (bill_detail as bd inner join bill as b on bd.bill_id = b.id) left join customers as cus on b.customer_id=cus.id
                  where b.created >= '$from' and b.created <= '$to' and bd.product_id={$productId} and {$wherePrice}";
        return $this->db->query($sql)->result('array');
    }

    public function promotionStatistic($from, $to)
    {
        $sql = "select bp.*, IF(ISNULL(b.price_total), 0, b.price_total) as price_total
                  from bill as b LEFT JOIN bill_promotion as bp on b.id = bp.bill_id
                  where b.created >= '$from' and b.created <= '$to' and b.ignor_statistic = 0";
        return $this->db->query($sql)->result();
    }

    public function statisticTotalDebit($from, $to)
    {
        $sql = "select sum(debit) as total_debit
                  from bill
                  where created >= '$from' and created <= '$to' and ignor_statistic = 0";
        return $this->db->query($sql)->row()->total_debit;
    }

    public function statisticTotalCash($from, $to)
    {
        $sql = "select sum(price_total) as total_cash
                  from bill
                  where created >= '$from' and created <= '$to' and ignor_statistic = 0";
        return $this->db->query($sql)->row()->total_cash;
    }

    public function addBillInventory($data)
    {
        $this->db->insert('bill_inventory', $data);
    }

    public function getBillInventory($order_id)
    {
        return $this->db->where('order_id', $order_id)->order_by('id', 'desc')->get('bill_inventory')->result();
    }

    public function getExportHistory($date)
    {
        $from = date('Y-m-d 00:00:00', strtotime($date));
        $to = date('Y-m-d 23:59:59', strtotime($date));
        $query = "select b.id, bd.product_id, bd.quantity, bd.returned, b.shipment_id, b.customer_id, s.truck_name, s.index, b.created as `date`
                  from bill b join bill_detail bd on b.id=bd.bill_id left join shipment_view s on b.shipment_id = s.id 
                  WHERE b.created >= '{$from}' AND b.created <= '{$to}'  order by b.created asc";
        return $this->db->query($query)->result_array();
    }

    public function getSalesCommissionStatistic( $from, $to ) {
        $sql = "SELECT bd.*, b.saler from bill_detail bd JOIN bill b ON bd.bill_id = b.id WHERE b.created >= '{$from}' AND b.created <= '{$to}' AND bd.commission_type is not null";
        return $this->db->query($sql)->result_array();
    }

    public function getListBillOfSaleCommission($from, $to, $productId, $saler, $type)
    {
        $sql = "select b.*, cus.name as customer_name   
                  from (bill_detail as bd inner join bill as b on bd.bill_id = b.id) left join customers as cus on b.customer_id=cus.id
                  where b.created >= '$from' and b.created <= '$to' and bd.product_id={$productId} and b.saler={$saler} AND bd.commission_type={$type}";
        return $this->db->query($sql)->result('array');
    }
}