<?php

class Tile {
    public /*int*/ $id;
    public /*int*/ $type; // 0 : FP, 1 : black, 2 : cyan, 3 : blue, 4 : yellow, 5 : red
    public /*string*/ $location; // deck (bag), factory, hand, line${playerId}, wall${playerId}, discard
    public /*int*/ $location_arg; // factory : 0 for center 1-9 for factories, line : 0 for floor line, 1-5, wall : yx line/column or x for floor line


    public function __construct($dbTile) {
        $this->id = intval($dbTile['id']);
        $this->type = intval($dbTile['type']);
        $this->location = $dbTile['location'];
        $this->location_arg = intval($dbTile['location_arg']);
    } 
}
?>
