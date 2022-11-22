<?php

class Staff_model extends MY_model{
    protected $table_name = 'staffs';
    
    public function get_array($arr = null) {
        return $this->db->select('*,
                                 (select name from position where id = staffs.position) as position_name')
                        ->get($this->table_name)
                        ->result();
    }

    public function getByPosition( $position ) {
        return $this->db->where('position', $position)
            ->get( $this->table_name)->result();
    }

}