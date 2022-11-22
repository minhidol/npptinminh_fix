<?php

class User_model extends MY_Model{
    protected $table_name = 'users';
    
    public function get_array($where_arr = null) {
        return $this->db->select('*,(select name from roles where id = users.role) as role_name')
                        ->where('active','0')
                        ->get($this->table_name)
                        ->result();
                        
    }
    public function get_login($user_name){
        return $this->db->where('user_name',$user_name)
                        ->where('active','0')
                        ->get($this->table_name)
                        ->row();
    }

    public function getSalers()
    {
        return $this->db->where('active','0')
                    ->where('user_name <>', 'admin')
                    ->get($this->table_name)
                    ->result_array();
    }
    
}