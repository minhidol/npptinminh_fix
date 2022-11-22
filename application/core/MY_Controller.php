<?php
if (!defined('BASEPATH'))
exit('No direct script access allowed');

class MY_Controller extends CI_Controller {
    protected $requiredRoleLevel;
    public function __construct()
    {
        parent::__construct();
        if(!is_integer($this->requiredRoleLevel)) {
            $this->requiredRoleLevel = ROLE_ACCOUNTANT;
        }
        $this->checkAllowAccess();

        if( $_SERVER['REQUEST_METHOD'] != 'GET' ) {
            log_message('CUSTOM', "{$GLOBALS['class']}::{$GLOBALS['method']} - {$_SERVER['REQUEST_URI']}: " . json_encode($this->input->json()));
        }
    }

    protected function checkAllowAccess($role = null) {
        $this->isLogged();

        if(is_null($role)) {
            $role = $this->requiredRoleLevel;
        }
        if (!$this->session->userdata('role') || $role < $this->session->userdata('role')) {
            echo 'Bạn không có quyền truy cập vào trang này!';
            exit;
        }
    }

    public function isLogged() {
        if (!$this->session->userdata('user_id')) {
            redirect('/login');
        }
    }
}