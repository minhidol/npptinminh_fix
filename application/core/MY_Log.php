<?php


class MY_Log extends CI_Log
{
    public function __construct()
    {
        parent::__construct();
        $this->_levels = array('ERROR' => 1, 'CUSTOM' => 2, 'DEBUG' => 3, 'INFO' => 4, 'ALL' => 5);
    }
}