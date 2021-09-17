<?php

trait ActionTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
//////////// 

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in azul.action.php)
    */
    
    function takeTiles(int $id) {
        self::checkAction('takeTiles'); 
        
        $playerId = intval(self::getActivePlayerId());

        // for undo
        $previousFirstPlayer = intval(self::getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN));

        $tile = $this->getTileFromDb($this->tiles->getCard($id));

        if ($tile->location !== 'factory') {
            throw new BgaUserException("Tile is not in a factory");
        }
        if ($tile->type === 0) {
            throw new BgaUserException("Tile is First Player token");
        }

        $factory = $tile->column;
        $factoryTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $factory));
        
        $firstPlayerTokens = [];
        $selectedTiles = [];
        $discardedTiles = [];
        $hasFirstPlayer = false;

        if ($factory == 0) {
            $firstPlayerTokens = array_values(array_filter($factoryTiles, function ($fpTile) { return $fpTile->type == 0; }));
            $hasFirstPlayer = count($firstPlayerTokens) > 0;

            foreach($factoryTiles as $factoryTile) {
                if ($tile->type == $factoryTile->type) {
                    $selectedTiles[] = $factoryTile;
                }
            }

            $this->tiles->moveCards(array_map('getIdPredicate', $selectedTiles), 'hand', $playerId);

            if ($hasFirstPlayer) {
                $this->putFirstPlayerTile($firstPlayerTokens, $playerId);
            }
        } else {
            foreach($factoryTiles as $factoryTile) {
                if ($tile->type == $factoryTile->type) {
                    $selectedTiles[] = $factoryTile;
                } else {
                    $discardedTiles[] = $factoryTile;
                }
            }

            $this->tiles->moveCards(array_map('getIdPredicate', $selectedTiles), 'hand', $playerId);
            $this->tiles->moveCards(array_map('getIdPredicate', $discardedTiles), 'factory', 0);
        }

        
        if ($hasFirstPlayer) {
            $message = clienttranslate('${player_name} takes ${number} ${color} and First Player tile');
        } else {
            $message = clienttranslate('${player_name} takes ${number} ${color}');
        }

        self::notifyAllPlayers('tilesSelected', $message, [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'number' => count($selectedTiles),
            'color' => $this->getColor($tile->type),              
            'type' => $tile->type,
            'selectedTiles' => $selectedTiles,
            'discardedTiles' => $discardedTiles,
            'fromFactory' => $factory,
        ]);

        $this->setGlobalVariable(UNDO_SELECT, new UndoSelect(
            $factory, 
            array_merge($selectedTiles, $discardedTiles, $firstPlayerTokens),
            $previousFirstPlayer
        ));

        $this->gamestate->nextState('placeTiles');
    }

    function undoTakeTiles() {
        self::checkAction('undoTakeTiles'); 

        if (!$this->allowUndo()) {
            throw new BgaUserException('Undo is disabled');
        }
        
        $playerId = intval(self::getActivePlayerId());

        $undo = $this->getGlobalVariable(UNDO_SELECT);

        $this->tiles->moveCards(array_map('getIdPredicate', $undo->tiles), 'factory', $undo->from);
        self::setGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN, $undo->previousFirstPlayer);

        self::notifyAllPlayers('undoTakeTiles', clienttranslate('${player_name} cancels tile selection'), [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'undo' => $undo,
        ]);

        $this->gamestate->nextState('undo');
    }

    function selectLine(int $line) {
        self::checkAction('selectLine'); 
        
        $playerId = self::getActivePlayerId();

        if (array_search($line, $this->availableLines($playerId)) === false) {
            throw new BgaUserException('Line not available');
        }

        $tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('hand', $playerId));
        $this->placeTilesOnLine($playerId, $tiles, $line, true);

        if ($this->lineWillBeComplete($playerId, $line)) {
            self::notifyAllPlayers('lastRound', clienttranslate('${player_name} will complete a line, it\'s last turn !'), [
                'playerId' => $playerId,
                'player_name' => self::getActivePlayerName(),
            ]);
        }

        $this->gamestate->nextState('nextPlayer');
    }

    function applySelectColumn(int $playerId, int $column) {
        if ($column > 0) {
            $this->setSelectedColumn($playerId, $column);
        } else {
            $line = intval(self::getGameStateValue(RESOLVING_LINE));
            $tiles = $this->getTilesFromLine($playerId, $line);
            $this->placeTilesOnLine($playerId, $tiles, 0, false);
        }
    }

    function selectColumn(int $column) {
        $playerId = self::getCurrentPlayerId();

        $this->applySelectColumn($playerId, $column);
            
        // Make this player unactive now (and tell the machine state to use transtion "placeTiles" if all players are now unactive
        $this->gamestate->setPlayerNonMultiactive($playerId, 'placeTiles');
    }

}
