<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

        //for ($i=1; $i<=4;$i++) { $this->debugSetWallColumn(2343492, $i); }
        //for ($i=1; $i<=4;$i++) { $this->debugSetWallColumn(2343493, $i); }

        //for ($i=1; $i<=5;$i++) { $this->addTilesInFactory(10, $i); }

        /*$tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('deck'));
        $tiles = array_slice($tiles, 0, 83);
        $this->tiles->moveCards(array_map('getIdPredicate', $tiles), 'discard');*/

        /*$this->debugSetWallTile(2343492, 1, 1, 1);
        $this->debugSetWallTile(2343492, 1, 2, 2);
        $this->debugSetWallTile(2343492, 1, 4, 4);
        $this->debugSetWallTile(2343492, 1, 5, 5);
        $this->debugSetLineTiles(2343492, 1, 1, 3);

        $this->debugSetWallTile(2343492, 5, 2, 1);
        $this->debugSetWallTile(2343492, 5, 1, 2);
        $this->debugSetWallTile(2343492, 5, 5, 4);
        $this->debugSetWallTile(2343492, 5, 4, 5);
        $this->debugSetLineTiles(2343492, 5, 5, 3);*/

        /*
        case 1: $colorName = _('Black'); break;
        case 2: $colorName = _('Cyan'); break;
        case 3: $colorName = _('Blue'); break;
        case 4: $colorName = _('Yellow'); break;
        case 5: $colorName = _('Red'); break;
        */
        /*$this->debugSetLineTiles(2343492, 1, 1, 1);
        $this->debugSetLineTiles(2343492, 2, 2, 1);
        $this->debugSetLineTiles(2343492, 4, 4, 4);
        $this->debugSetLineTiles(2343492, 5, 5, 3);

        $this->debugSetWallTile(2343492, 1, 1, 5);
        $this->debugSetWallTile(2343492, 1, 2, 2);
        $this->debugSetWallTile(2343492, 1, 3, 4);
        $this->debugSetWallTile(2343492, 2, 1, 3);
        $this->debugSetWallTile(2343492, 2, 2, 4);
        $this->debugSetWallTile(2343492, 2, 3, 5);
        $this->debugSetWallTile(2343492, 2, 4, 2);
        $this->debugSetWallTile(2343492, 3, 1, 2);
        $this->debugSetWallTile(2343492, 3, 2, 5);
        $this->debugSetWallTile(2343492, 3, 3, 1);
        $this->debugSetWallTile(2343492, 4, 2, 1);
        $this->debugSetWallTile(2343492, 4, 3, 2);
        $this->debugSetWallTile(2343492, 4, 4, 3);
        $this->debugSetWallTile(2343492, 5, 1, 1);*/

        /*$this->gamestate->changeActivePlayer(2343492);

        $this->debugSetLineTiles(2343493, 1, 1, 3);
        $this->debugSetLineTiles(2343493, 2, 2, 5);
        $this->debugSetLineTiles(2343493, 4, 2, 4);
        $this->debugSetLineTiles(2343493, 5, 5, 2);

        $this->debugSetWallTile(2343493, 1, 1, 2);
        $this->debugSetWallTile(2343493, 2, 3, 1);
        $this->debugSetWallTile(2343493, 3, 5, 5);*/

        // platinumove
        $this->debugSetLineTiles(2343492, 1, 1, 3);
        $this->debugSetLineTiles(2343492, 2, 2, 5);
        $this->debugSetLineTiles(2343492, 4, 2, 4);
        $this->debugSetLineTiles(2343492, 5, 5, 2);
        $this->debugSetWallTile(2343492, 1, 1, 2);
        $this->debugSetWallTile(2343492, 2, 3, 1);
        $this->debugSetWallTile(2343492, 3, 5, 5);

        // Aloyra
        $this->debugSetLineTiles(2343493, 1, 1, 3);
        $this->debugSetLineTiles(2343493, 2, 2, 2);
        $this->debugSetLineTiles(2343493, 3, 1, 5);
        $this->debugSetLineTiles(2343493, 4, 4, 3);
        $this->debugSetWallTile(2343493, 3, 3, 3);
        $this->debugSetWallTile(2343493, 5, 1, 3);

        // gerbroe
        $this->debugSetLineTiles(2343494, 1, 1, 4);
        $this->debugSetLineTiles(2343494, 2, 2, 3);
        $this->debugSetLineTiles(2343494, 4, 4, 1);
        $this->debugSetLineTiles(2343494, 5, 5, 5);
        $this->debugSetWallTile(2343494, 3, 3, 1);
        $this->debugSetWallTile(2343494, 4, 3, 2);

        // suny03ua
        $this->debugSetLineTiles(2343495, 1, 1, 5);
        $this->debugSetLineTiles(2343495, 2, 2, 5);
        $this->debugSetLineTiles(2343495, 3, 3, 4);
        $this->debugSetLineTiles(2343495, 4, 2, 1);
        $this->debugSetLineTiles(2343495, 5, 2, 4);
        $this->debugSetWallTile(2343495, 2, 3, 2);
        $this->debugSetWallTile(2343495, 3, 3, 1);
        $this->debugSetWallTile(2343495, 4, 3, 4);

        // update `tile` set card_location='discard' where card_location='factory' and card_location_arg <> 1
    }

    function debugPlayRandomlyToTen() {
        if ($this->getBgaEnvironment() != 'studio') { 
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

    function debugSetWallColumn(int $playerId, int $column) {
        $tiles = $this->getTilesFromDb($this->tiles->getCardsOnTop(5, 'deck'));

        $line = 0;
        foreach ($tiles as $tile) {
            $this->tiles->moveCard($tile->id, 'wall'.$playerId, (++$line)*100 + $column);
        }
    }

    function debugSetWallTile(int $playerId, int $line, int $column, int $color) {
        $tile = $this->getTilesFromDb($this->tiles->getCardsOfTypeInLocation($color, null, 'deck'))[0];

        $this->tiles->moveCard($tile->id, 'wall'.$playerId, $line*100 + $column);
    }

    function debugSetLineTiles(int $playerId, int $line, int $number, int $color) {
        $tiles = $this->getTilesFromDb($this->tiles->getCardsOfTypeInLocation($color, null, 'deck'));
        $this->placeTilesOnLine($playerId, array_slice($tiles, 0, $number), $line, false);
    }

    function debugEmptyFactories() {
        $factoryNumber = $this->getFactoryNumber();
        for ($i = 1; $i<=$factoryNumber; $i++) {
            if (intval($this->tiles->countCardInLocation('factory', $i)) > 0) {
                $tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $i));
                foreach ($tiles as $key => $tile) {
                    if ($i > 1 || $key > 0) {
                        $this->tiles->moveCard($tile->id, 'discard');
                    }
                }
            }
        }
    }

    function addTilesInFactory(int $number, int $color, $factory = 0) {
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

    function debugPlayRandomlyForPlayer(int $playerId) {
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
