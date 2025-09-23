<?php

class Undo {
    public /*int*/ $from;
    public /*Tile[]*/ $tiles;
    public /*int*/ $previousFirstPlayer;
    public /*boolean*/ $lastRoundBefore;
    public /*boolean*/ $takeFromSpecialFactoryZero;

    public function __construct(array $tiles, $from = null, $previousFirstPlayer = null, $lastRoundBefore = null, $takeFromSpecialFactoryZero = null) {
        $this->from = $from;
        $this->tiles = $tiles;
        $this->previousFirstPlayer = $previousFirstPlayer;
        $this->lastRoundBefore = $lastRoundBefore;
        $this->takeFromSpecialFactoryZero = $takeFromSpecialFactoryZero;
    }
}
?>
