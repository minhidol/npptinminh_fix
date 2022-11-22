<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Dashboard extends MY_Controller {

    public function __construct()
    {
        parent::__construct();
    }
    public function index() {
        #pass cpenl @Hatrantin#
        $this->load->helper('html');
        $this->load->helper('url');
        $this->required_login();
        $this->load->model('user_model','user');
        $user = $this->user->get_by_id($this->session->userdata('user_id'));
        $this->load->view('dashboard', array('user' => $user));
    }
    public function page404(){
        $this->load->view('404');
    }
    public function required_login(){
        $this->load->library('session');
        $user_id = $this->session->userdata('user_id');
        if($user_id == '')
            redirect('login');
    }
}

/* End of file welcome.php */
/* Location: ./application/controllers/welcome.php */