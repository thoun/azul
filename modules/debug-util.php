<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        global $g_config;
        if (!$g_config['debug_from_chat']) { 
            return;
        } 

        //for ($i=1; $i<=4;$i++) { $this->debugSetWallColumn(2343492, $i); }
        //for ($i=1; $i<=4;$i++) { $this->debugSetWallColumn(2343493, $i); }

        //for ($i=1; $i<=5;$i++) { $this->addTilesInFactory(10, $i); }

        $this->debugSetWallTile(2343492, 1, 1, 1);
        $this->debugSetWallTile(2343492, 1, 2, 2);
        $this->debugSetWallTile(2343492, 1, 4, 4);
        $this->debugSetWallTile(2343492, 1, 5, 5);
        $this->debugSetLineTiles(2343492, 1, 1, 3);

        $this->debugSetWallTile(2343492, 5, 2, 1);
        $this->debugSetWallTile(2343492, 5, 1, 2);
        $this->debugSetWallTile(2343492, 5, 5, 4);
        $this->debugSetWallTile(2343492, 5, 4, 5);
        $this->debugSetLineTiles(2343492, 5, 5, 3);

        $this->gamestate->changeActivePlayer(2343492);
    }

    function debugPlayRandomlyToTen() {
        global $g_config;
        if (!$g_config['debug_from_chat']) { 
            return;
        } 

        $playersIds = $this->getPlayersIds();
        $coup = 0;
        while (intval($this->tiles->countCardInLocation('factory')) >= 10) {
            $playerId = $playersIds[$coup % count($playersIds)];
            $this->debugPlayRandomlyForPlayer($playerId);
            $coup++;
        }
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

    private function debugSetLineTiles(int $playerId, int $line, int $number, int $color) {
        $tiles = $this->getTilesFromDb($this->tiles->getCardsOfTypeInLocation($color, null, 'deck'));
        $this->placeTilesOnLine($playerId, array_slice($tiles, 0, $number), $line, false);
    }

    private function addTilesInFactory(int $number, int $color, $factory = 0) {
        $colorTiles = $this->getTilesFromDb($this->tiles->getCardsOfTypeInLocation($color, null, 'deck'));

        $tiles = array_slice($colorTiles, 0, $number);

        $this->tiles->moveCards(array_map('getIdPredicate', $tiles), 'factory', $factory);

    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }

    private function debugPlayRandomlyForPlayer(int $playerId) {
        $factories = [];
        $factoryNumber = $this->getFactoryNumber();
        for ($i = 0; $i<=$factoryNumber; $i++) {
            if (intval($this->tiles->countCardInLocation('factory', $i)) > 0) {
                $factories[] = $i;
            }
        }

        $factory = bga_rand(0, count($factories) - 1);
        $tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $factory));
        //if (count($tiles) > 0) {
            $line = $this->array_some($tiles, function ($tile) { return $tile->type == 0; }) ? 0 : bga_rand(0, 5);

            $this->placeTilesOnLine($playerId, $tiles, $line, false);
        //}
    }
}
