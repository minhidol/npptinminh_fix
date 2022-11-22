<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Debit extends MY_Controller {

    public  function __construct()
    {
        $this->requiredRoleLevel = ROLE_ADMIN;
        parent::__construct();
    }

    public function totalLiability() {
        $this->load->model('warehousing_model');
        $warehousing = $this->warehousing_model->get_all_debit();
        echo json_encode($warehousing);
    }
    public function totalLiabilityDetail() {
        $parnerid = $this->input->get('par');
        $this->load->model('warehousing_model');
        $warehousing = $this->warehousing_model->getDebit( $parnerid );
//        $warehousing = array_filter($warehousing, function($value) use ($parnerid){return $value->partner_id == $parnerid;});
        echo json_encode(array('bill' => $warehousing));
    }

    public function totalDebitDetail() {
        $cusid = $this->input->get('cus');
        $this->load->model('bill_model');
        $bill = $this->bill_model->getDebit( $cusid );
//        $bill = array_filter($bill, function($value) use($cusid) {return $value->customer_id == $cusid;});
        echo json_encode(array('bill' => array_values($bill)));
    }
    public function totalDebit() {
        $this->load->model('Debits_model');
        $cusDebit = $this->Debits_model->get_all_debit();
        $cusIds1 = array_column($cusDebit, 'id');
        $cusDebit = array_combine($cusIds1, $cusDebit);

        $this->load->model('warehousing_model');
        $warehousing = $this->warehousing_model->get_all_debit();
        $cusIds2 = array_column($warehousing, 'id');
        $warehousing = array_combine($cusIds2, $warehousing);

        $cusIds = array_unique( array_merge($cusIds1, $cusIds2));

        $data = [];
        foreach ($cusIds as $id ) {
            if(isset($cusDebit[$id])) {
                $data[$id] = $cusDebit[$id];
                $data[$id]['tongLayHang'] = (float)$cusDebit[$id]['total_debit'];
                unset($data[$id]['total_debit']);

                $data[$id]['tongTinNo'] = isset($warehousing[$id]) ? (float)$warehousing[$id]['total_debit'] : 0;
            } else {
                $data[$id] = $warehousing[$id];
                $data[$id]['tongTinNo'] = $warehousing[$id]['total_debit'];
                unset($data[$id]['total_debit']);

                $data[$id]['tongLayHang'] = isset($cusDebit[$id]) ? $cusDebit[$id]['total_debit'] : 0;
            }
        }

        echo json_encode($data);
    }
    public function warehousingDetail(){
        $warehousing_id = $this->input->get('id');
        $this->load->model('warehousing_model');
        $this->load->model('customers_model','customers');
        $warehousing = $this->warehousing_model->get_by_id($warehousing_id);
        $warehousing->partner_detail = $this->customers->get_by_id($warehousing->partner_id);
        echo json_encode(array('bill' => $warehousing));
    }

    public function customerDebit() {
        $id = $this->input->get('i');
        if($id) {
            $this->load->model('bill_model');
            $debit = $this->bill_model->getCustomerDebit($id);
            $debit = is_null($debit)? 0 : $debit;
            echo json_encode($debit);
        }
        else echo json_encode(['debit' => 0]);
    }

    public function pay()
    {
        $this->db->trans_start();
        try {
            $data = $this->input->json();

            $this->load->model('Bill_model', 'bill');
            $this->load->model('Debits_model', 'Debit');
            $bills = $this->bill->getDebit($data->cusid);
            $totalCurrent = 0;
            foreach ($bills as $bill) {
                $totalCurrent += $bill->debit;
            }

            $cutoff = $totalCurrent - $data->debit;
            $bills = array_reverse($bills);
            $deb = 0;
            foreach ($bills as $bill) {
                if ($deb < $cutoff) {
                    $deb += $bill->debit;
                    continue;
                }

                $this->bill->update(['ignor_debit' => 1], ['id' => $bill->id]);
            }

            $bill_data = [
                'customer_id' => $data->cusid,
                'price_total' => $data->debit,
                'debit' => $cutoff - $deb,
                'ignor_debit' => $cutoff - $deb == 0 ? '1' : 0,
                'note' => 'Thanh toán'
            ];
            $bill_id = $this->bill->insert($bill_data);
            $code_bill = 'W' . substr("00000000{$bill_id}", -9);
            $this->bill->update(['bill_code' => $code_bill], ['id' => $bill_id]);
        } catch (Exception  $ex ) {
            log_message('ERROR', $ex->getMessage() . "\n" . $ex->getTraceAsString() );
            $this->db->trans_rollback();
        }

        $this->db->trans_commit();

    }
    public function payLiability()
    {
        $this->db->trans_start();
        try {
            $data = $this->input->json();

            $this->load->model('warehousing_model');
            $warehousing = $this->warehousing_model->getDebit($data->parid);
            $totalDeb = 0;
            foreach ($warehousing as $bill) {
                $totalDeb += $bill->debit;
            }

            $cutoff = $totalDeb - $data->debit;

            $warehousing = array_reverse( $warehousing );
            $deb = 0;
            foreach ($warehousing as $bill ) {
                if ( $deb < $cutoff ) {
                    $deb += $bill->debit;
                    continue;
                }

                $this->warehousing_model->update(['debit_paid' => 1], ['id' => $bill->id]);
            }

            $insertData = [
                'partner_id' => $data->parid,
                'price' => $data->debit,
                'debit' => $cutoff - $deb,
                'debit_paid' => $cutoff - $deb == 0 ? '1' : '0',
                'note' => 'Thanh toán'
            ];
            $this->warehousing_model->insert($insertData);
        } catch (Exception  $ex ) {
            log_message('ERROR', $ex->getMessage() . "\n" . $ex->getTraceAsString() );
            $this->db->trans_rollback();
        }

        $this->db->trans_commit();

    }

    public function getPrintingDebit(){
        $id = $this->input->get('id');

        $this->load->model('warehousing_model');
        $warehousing = $this->warehousing_model->getDebit( $id );
        $this->load->model('Products_buy_price_model', 'warehousingDetail');
        foreach( $warehousing as $item ){
            $detail = $this->warehousingDetail->get_by_warehousing_id($item->id);
            $item->detail = $detail;

            $sum = 0;
        }

        $this->load->model('bill_model');
        $bills = $this->bill_model->getDebit( $id );

        $this->load->model('Bill_detail_model', 'BillDetail');
        foreach($bills as $bill) {
            $detail = $this->BillDetail->get_by_bill_id( $bill->id );
            $sum = 0;
            foreach ($detail as $item ) {
                $sum += $item->price * $item->quantity;
            }
            $bill->detail = $detail;
            $bill->totalValue = $sum;
        }

        $this->load->model('customers_model','customers');
        $customer = $this->customers->get_by_id($id);

        $startDate = date('Y-m-d');
        if ( count( $warehousing) > 0 ) {
            $startDate = $warehousing[0]->created;
        }

        if ( count( $bills ) > 0 ) {
            if ( $startDate > $bills[0]->created ) $startDate = $bills[0]->created;
        }

        $startDate = date('d/m/Y', strtotime($startDate));

        echo json_encode([
            'bills' => $bills,
            'imports' => $warehousing,
            'customer' => $customer,
            'startDate' => $startDate
        ]);
    }
}

