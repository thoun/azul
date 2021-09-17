<?php

class UndoSelect {
    public /*int*/ $from;
    public /*Tile[]*/ $tiles;
    public /*int*/ $previousFirstPlayer;

    public function __construct(int $from, array $tiles, int $previousFirstPlayer) {
        $this->from = $from;
        $this->tiles = $tiles;
        $this->previousFirstPlayer = $previousFirstPlayer;
    }
}
?>
