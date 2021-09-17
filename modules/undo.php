<?php

class Undo {
    public /*int*/ $from;
    public /*Tile[]*/ $tiles;
    public /*int*/ $previousFirstPlayer;

    public function __construct(array $tiles, $from = null, $previousFirstPlayer = null) {
        $this->from = $from;
        $this->tiles = $tiles;
        $this->previousFirstPlayer = $previousFirstPlayer;
    }
}
?>
