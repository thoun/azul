<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        for ($i=1; $i<=4;$i++) {
            $this->debugSetWallComun(2343492, $i);
        }

        // Activate first player must be commented in setup if this is used
        $this->gamestate->changeActivePlayer(2343493);
    }

    private function debugSetWallComun(int $playerId, int $column) {
        $tiles = $this->getTilesFromDb($this->tiles->getCardsOnTop(5, 'deck'));

        $line = 0;
        foreach ($tiles as $tile) {
            $this->tiles->moveCard($tile->id, 'wall'.$playerId, (++$line)*100 + $column);
        }
    }
}
