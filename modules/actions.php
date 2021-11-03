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
            'preserve' => [ 2 => 'type' ],
            'selectedTiles' => $selectedTiles,
            'discardedTiles' => $discardedTiles,
            'fromFactory' => $factory,
        ]);

        $this->setGlobalVariable(UNDO_SELECT, new Undo(
            array_merge($selectedTiles, $discardedTiles, $firstPlayerTokens),
            $factory, 
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

        $lastRoundLogged = intval(self::getGameStateValue(END_TURN_LOGGED)) > 0;
        if ($this->lineWillBeComplete($playerId, $line) && !$lastRoundLogged) {
            self::notifyAllPlayers('lastRound', clienttranslate('${player_name} will complete a line, it\'s last turn !'), [
                'playerId' => $playerId,
                'player_name' => self::getActivePlayerName(),
            ]);
            self::setGameStateValue(END_TURN_LOGGED, 1);
        }

        $this->setGlobalVariable(UNDO_PLACE, new Undo($tiles, null, null, $lastRoundLogged));

        if ($this->allowUndo()) {
            $this->gamestate->nextState('confirm');
        } else {
            $this->gamestate->nextState('nextPlayer');
        }
    }

    function confirmLine() {
        self::checkAction('confirmLine'); 
        
        $this->gamestate->nextState('nextPlayer');
    }
    
    function undoSelectLine() {
        self::checkAction('undoSelectLine'); 

        if (!$this->allowUndo()) {
            throw new BgaUserException('Undo is disabled');
        }
        
        $playerId = intval(self::getActivePlayerId());       

        $undo = $this->getGlobalVariable(UNDO_PLACE);

        $this->tiles->moveCards(array_map('getIdPredicate', $undo->tiles), 'hand', $playerId);

        $lastRoundLogged = intval(self::getGameStateValue(END_TURN_LOGGED)) > 0;
        if ($lastRoundLogged && !$undo->lastRoundBefore) {
            self::setGameStateValue(END_TURN_LOGGED, 0);
        }

        self::notifyAllPlayers('undoSelectLine', clienttranslate('${player_name} cancels tile placement'), [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'undo' => $undo,
        ]);
        
        $this->gamestate->nextState('undo');
    }

    function selectColumn(int $line, int $column) {
        $playerId = intval(self::getCurrentPlayerId());

        $this->setSelectedColumn($playerId, $line, $column);

        self::notifyPlayer($playerId, 'updateSelectColumn', '', [
            'playerId' => $playerId,
            'arg' => $this->argChooseColumnForPlayer($playerId),
        ]);
    }

    function confirmColumns() {
        $playerId = intval(self::getCurrentPlayerId());

        // Make this player unactive now (and tell the machine state to use transtion "placeTiles" if all players are now unactive
        $this->gamestate->setPlayerNonMultiactive($playerId, 'confirmColumns');
    }

    function undoColumns() {
        $playerId = intval(self::getCurrentPlayerId());

        self::DbQuery("UPDATE player SET selected_columns = '[]' WHERE player_id = $playerId");
        
        self::notifyPlayer($playerId, 'updateSelectColumn', '', [
            'playerId' => $playerId,
            'arg' => $this->argChooseColumnForPlayer($playerId),
            'undo' => true,
        ]);
    }

}
