<?php
if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class User extends MY_Controller{
    
    public function __construct() {
        $this->requiredRoleLevel = ROLE_ADMIN;
        parent::__construct();
        $this->load->model('user_model','user');
        $this->load->model('role_model','role');
    }
    public function index(){
        $users = $this->user->get_array(array('active' => '0'));
        $roles = $this->role->get_all();
        foreach ($users as &$u) {
            $u->password = '';
        }
        echo json_encode(array('roles' => $roles,'users' => $users));
    }
    public function createUser(){
        $user = $this->input->json();
        $user->password = password_hash($user->password, PASSWORD_BCRYPT);
        $user_id = $this->user->insert($user);
        echo json_encode($user_id);
    }
    public function getUser(){
        $user_id = $this->input->get('id');
        $user = $this->user->get_by_id($user_id);
        $user->password = '';
        echo json_encode(array('user' => $user));
    }
    public function editUser(){
        $user_id = $this->input->get('id');
        $user = $this->input->json();
        if (!empty($user->password)) {
            $user->password = password_hash($user->password, PASSWORD_BCRYPT);
        }
        $this->user->update($user,array('id' => $user_id));
    }
    public function deleteUser(){
        $user_id = $this->input->get('id');
        $this->user->update(array('active' => '1'),array('id' => $user_id));
    }

    public function getAll()
    {
        $user = $this->user->getSalers();
        echo json_encode(array('user' => $user));
    }
}

