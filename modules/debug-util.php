<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    // shortcut to launch multiple debug lines
    function d() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

        $this->debug_EmptyFactories();
        //$this->debug_RemoveFp();
        //$this->stFillFactories();
    }

    function debug_Setup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

        //for ($i=1; $i<=4;$i++) { $this->debug_SetWallColumn(2343492, $i); }
        //for ($i=1; $i<=4;$i++) { $this->debug_SetWallColumn(2343493, $i); }

        //for ($i=1; $i<=5;$i++) { $this->addTilesInFactory(10, $i); }

        /*$tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('deck'));
        $tiles = array_slice($tiles, 0, 83);
        $this->tiles->moveCards(array_map('getIdPredicate', $tiles), 'discard');*/

        /*$this->debug_SetLineTiles(2343492, 1, 1, 3);
        $this->debug_SetLineTiles(2343492, 2, 2, 3);
        $this->debug_SetWallTile(2343492, 2, 1, 1);
        $this->debug_SetWallTile(2343492, 2, 2, 2);
        $this->debug_SetWallTile(2343492, 2, 4, 4);
        $this->debug_SetWallTile(2343492, 2, 5, 5);

        $this->debug_EmptyFactories();
        $this->debug_RemoveFp();*/

        $this->debug_SetLineTiles(2343492, 3, 10, 1);
        $this->debug_SetLineTiles(2343493, 4, 10, 1);
        /*$this->debug_SetLineTiles(2343492, 1, 1, 3);

        $this->debug_SetWallTile(2343492, 5, 2, 1);
        $this->debug_SetWallTile(2343492, 5, 1, 2);
        $this->debug_SetWallTile(2343492, 5, 5, 4);
        $this->debug_SetWallTile(2343492, 5, 4, 5);
        $this->debug_SetLineTiles(2343492, 5, 5, 3);*/

        /*$this->debug_SetLineTiles(2343492, 3, 3, 1);
        $this->debug_SetLineTiles(2343492, 4, 3, 2);
        $this->debug_SetLineTiles(2343492, 5, 4, 5);
        $this->debug_SetWallTile(2343492, 1, 1, 5);
        $this->debug_SetWallTile(2343492, 1, 2, 2);
        $this->debug_SetWallTile(2343492, 1, 3, 3);
        $this->debug_SetWallTile(2343492, 2, 1, 3);
        $this->debug_SetWallTile(2343492, 2, 2, 4);
        $this->debug_SetWallTile(2343492, 2, 3, 1);
        $this->debug_SetWallTile(2343492, 2, 4, 5);
        $this->debug_SetWallTile(2343492, 3, 2, 5);
        $this->debug_SetWallTile(2343492, 3, 3, 2);
        $this->debug_SetWallTile(2343492, 4, 1, 4);
        $this->debug_SetWallTile(2343492, 4, 2, 1);
        $this->debug_SetWallTile(2343492, 4, 3, 5);
        $this->debug_SetWallTile(2343492, 5, 1, 2);
        $this->debug_SetWallTile(2343492, 5, 2, 3);
        $this->debug_SetWallTile(2343492, 5, 3, 4);
        
        $this->debug_SetLineTiles(2343493, 1, 1, 1);
        $this->debug_SetLineTiles(2343493, 4, 2, 5);
        $this->debug_SetLineTiles(2343493, 5, 5, 4);*/

        /*
        case 1: $colorName = _('Black'); break;
        case 2: $colorName = _('Cyan'); break;
        case 3: $colorName = _('Blue'); break;
        case 4: $colorName = _('Yellow'); break;
        case 5: $colorName = _('Red'); break;
        */
        /*$this->debug_SetLineTiles(2343492, 1, 1, 1);
        $this->debug_SetLineTiles(2343492, 2, 2, 1);
        $this->debug_SetLineTiles(2343492, 4, 4, 4);
        $this->debug_SetLineTiles(2343492, 5, 5, 3);

        $this->debug_SetWallTile(2343492, 1, 1, 5);
        $this->debug_SetWallTile(2343492, 1, 2, 2);
        $this->debug_SetWallTile(2343492, 1, 3, 4);
        $this->debug_SetWallTile(2343492, 2, 1, 3);
        $this->debug_SetWallTile(2343492, 2, 2, 4);
        $this->debug_SetWallTile(2343492, 2, 3, 5);
        $this->debug_SetWallTile(2343492, 2, 4, 2);
        $this->debug_SetWallTile(2343492, 3, 1, 2);
        $this->debug_SetWallTile(2343492, 3, 2, 5);
        $this->debug_SetWallTile(2343492, 3, 3, 1);
        $this->debug_SetWallTile(2343492, 4, 2, 1);
        $this->debug_SetWallTile(2343492, 4, 3, 2);
        $this->debug_SetWallTile(2343492, 4, 4, 3);
        $this->debug_SetWallTile(2343492, 5, 1, 1);*/

        /*$this->gamestate->changeActivePlayer(2343492);

        $this->debug_SetLineTiles(2343493, 1, 1, 3);
        $this->debug_SetLineTiles(2343493, 2, 2, 5);
        $this->debug_SetLineTiles(2343493, 4, 2, 4);
        $this->debug_SetLineTiles(2343493, 5, 5, 2);

        $this->debug_SetWallTile(2343493, 1, 1, 2);
        $this->debug_SetWallTile(2343493, 2, 3, 1);
        $this->debug_SetWallTile(2343493, 3, 5, 5);*/

        /*// platinumove
        $this->debug_SetLineTiles(2343492, 1, 1, 3);
        $this->debug_SetLineTiles(2343492, 2, 2, 5);
        $this->debug_SetLineTiles(2343492, 4, 2, 4);
        $this->debug_SetLineTiles(2343492, 5, 5, 2);
        $this->debug_SetWallTile(2343492, 1, 1, 2);
        $this->debug_SetWallTile(2343492, 2, 3, 1);
        $this->debug_SetWallTile(2343492, 3, 5, 5);

        // Aloyra
        $this->debug_SetLineTiles(2343493, 1, 1, 3);
        $this->debug_SetLineTiles(2343493, 2, 2, 2);
        $this->debug_SetLineTiles(2343493, 3, 1, 5);
        $this->debug_SetLineTiles(2343493, 4, 4, 3);
        $this->debug_SetWallTile(2343493, 3, 3, 3);
        $this->debug_SetWallTile(2343493, 5, 1, 3);

        // gerbroe
        $this->debug_SetLineTiles(2343494, 1, 1, 4);
        $this->debug_SetLineTiles(2343494, 2, 2, 3);
        $this->debug_SetLineTiles(2343494, 4, 4, 1);
        $this->debug_SetLineTiles(2343494, 5, 5, 5);
        $this->debug_SetWallTile(2343494, 3, 3, 1);
        $this->debug_SetWallTile(2343494, 4, 3, 2);

        // suny03ua
        $this->debug_SetLineTiles(2343495, 1, 1, 5);
        $this->debug_SetLineTiles(2343495, 2, 2, 5);
        $this->debug_SetLineTiles(2343495, 3, 3, 4);
        $this->debug_SetLineTiles(2343495, 4, 2, 1);
        $this->debug_SetLineTiles(2343495, 5, 2, 4);
        $this->debug_SetWallTile(2343495, 2, 3, 2);
        $this->debug_SetWallTile(2343495, 3, 3, 1);
        $this->debug_SetWallTile(2343495, 4, 3, 4);*/

        // update `tile` set card_location='discard' where card_location='factory' and card_location_arg <> 1
        $this->debug_EmptyFactories();
        $this->gamestate->changeActivePlayer(2343492);
    }

    function debug_PlayRandomlyToTen() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }

        $playersIds = $this->getPlayersIds();
        $coup = 0;
        while (intval($this->tiles->countCardInLocation('factory')) >= 10) {
            $playerId = $playersIds[$coup % count($playersIds)];
            $this->debug_PlayRandomlyForPlayer($playerId);
            $coup++;
        }
    }

    function debug_SetWallColumn(int $playerId, int $column) {
        $tiles = $this->getTilesFromDb($this->tiles->getCardsOnTop(5, 'deck'));

        $line = 0;
        foreach ($tiles as $tile) {
            $this->tiles->moveCard($tile->id, 'wall'.$playerId, (++$line)*100 + $column);
        }
    }

    function debug_SetWallTile(int $playerId, int $line, int $column, int $color) {
        $tile = $this->getTilesFromDb($this->tiles->getCardsOfTypeInLocation($color, null, 'deck'))[0];

        $this->tiles->moveCard($tile->id, 'wall'.$playerId, $line*100 + $column);
    }

    function debug_SetLineTiles(int $playerId, int $line, int $number, int $color) {
        $tiles = $this->getTilesFromDb($this->tiles->getCardsOfTypeInLocation($color, null, 'deck'));
        $this->placeTilesOnLine($playerId, array_slice($tiles, 0, $number), $line, false);
    }

    function debug_EmptyFactories($full = false) {
        $this->debug_RemoveFp();

        $factoryNumber = $this->getFactoryNumber();
        for ($i = 1; $i<=$factoryNumber; $i++) {
            if (intval($this->tiles->countCardInLocation('factory', $i)) > 0) {
                $tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $i));
                foreach ($tiles as $key => $tile) {
                    if ($full || $i > 1 || $key > 0) {
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

    function debug_RemoveFp() {
        $factoryTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', 0));
        $firstPlayerTokens = array_values(array_filter($factoryTiles, fn($fpTile) => $fpTile->type == 0));
        $hasFirstPlayer = count($firstPlayerTokens) > 0;
        if ($hasFirstPlayer) {
            $this->putFirstPlayerTile($firstPlayerTokens, 2343492);
        }
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }

    function debug_PlayRandomlyForPlayer(int $playerId) {
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
            $line = $this->array_some($tiles, fn($tile) => $tile->type == 0) ? 0 : bga_rand(0, 5);

            $this->placeTilesOnLine($playerId, $tiles, $line, false);
        //}
    }

    function debug_playToEndRound() {
      $round = $this->getStat('roundsNumber');
      while (intval($this->gamestate->state_id()) < ST_END_ROUND && $this->getStat('roundsNumber') == $round) {
        $state = intval($this->gamestate->state_id());
        $playerId = intval($this->getActivePlayerId());
        switch ($state) {
          case ST_PLAYER_CHOOSE_TILE:
            $this->zombieTurn_chooseTile($playerId);
            break;     
          case ST_PLAYER_CHOOSE_FACTORY:
            $this->zombieTurn_chooseFactory($playerId);
            break;
          case ST_PLAYER_CHOOSE_LINE:
            $this->zombieTurn_chooseLine($playerId);
            break;
          case ST_PLAYER_CONFIRM_LINE:
            $this->zombieTurn_confirmLine($playerId);
            break;
        }
      }
    }
}