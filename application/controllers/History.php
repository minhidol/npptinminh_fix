<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class History extends MY_Controller {

    public function __construct()
    {
        $this->requiredRoleLevel = ROLE_ADMIN;
        parent::__construct();
    }
    public function warehousingHistory() {
        $this->load->model('warehousing_history_model','history');
        $history = $this->history->get_all();
        echo json_encode(array('history' => $history));
    }

    public function updateDailyInventory() {
    	if ( is_cli() ) {
		    $this->load->model('warehousing_history_model','history');
		    $this->history->updateDailyInvetory();
	    }
    }
    
}

