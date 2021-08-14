<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        //for ($i=1; $i<=4;$i++) { $this->debugSetWallColumn(2343492, $i); }

        //for ($i=1; $i<=5;$i++) { $this->addTilesInFactory($i, $i); }

        $this->debugSetWallTile(2343492, 1, 1, 1);
        $this->debugSetWallTile(2343492, 1, 2, 2);
        $this->debugSetWallTile(2343492, 1, 4, 4);
        $this->debugSetWallTile(2343492, 1, 5, 5);
        $this->debugSetWallTile(2343492, 2, 3, 3);

        $this->gamestate->changeActivePlayer(2343492);
    }

    private function debugSetWallColumn(int $playerId, int $column) {
        $tiles = $this->getTilesFromDb($this->tiles->getCardsOnTop(5, 'deck'));

        $line = 0;
        foreach ($tiles as $tile) {
            $this->tiles->moveCard($tile->id, 'wall'.$playerId, (++$line)*100 + $column);
        }
    }

    private function debugSetWallTile(int $playerId, int $line, int $column, int $color) {
        $tile = $this->getTilesFromDb($this->tiles->getCardsOfTypeInLocation($color, null, 'deck'))[0];

        $this->tiles->moveCard($tile->id, 'wall'.$playerId, $line*100 + $column);
    }

    private function addTilesInFactory(int $number, int $color, $factory = 0) {
        $colorTiles = $this->getTilesFromDb($this->tiles->getCardsOfTypeInLocation($color, null, 'deck'));

        $tiles = array_slice($colorTiles, 0, $number);

        $this->tiles->moveCards(array_map('getIdPredicate', $tiles), 'factory', 0);

    }
}
