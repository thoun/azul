<?php

trait ActionTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
//////////// 

    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in azul.action.php)
    */
    
    function actTakeTiles(int $id) {
        $playerId = intval($this->getActivePlayerId());

        // for undo
        $previousFirstPlayer = intval($this->getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN));

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

        $specialFactories = null;

        $takeFromSpecialFactoryZero = false;
        $specialFactories = $this->isSpecialFactories() ? $this->getSpecialFactories() : null;

        if ($factory == 0) {
            $firstPlayerTokens = array_values(array_filter($factoryTiles, fn($fpTile) => $fpTile->type == 0));
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
            $discardOtherTiles = true;

            if ($specialFactories !== null && array_key_exists($factory, $specialFactories)) {
                if ($specialFactories[$factory] == 6) {
                    $takeFromSpecialFactoryZero = true;
                    $this->setGameStateValue(SPECIAL_FACTORY_ZERO_OWNER, $playerId);
                } else if (in_array($specialFactories[$factory], [7, 8])) {
                    $discardOtherTiles = false;
                }
            }

            foreach($factoryTiles as $factoryTile) {
                if ($tile->type == $factoryTile->type) {
                    $selectedTiles[] = $factoryTile;
                } else if ($discardOtherTiles) {
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

        $this->notifyAllPlayers('tilesSelected', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getActivePlayerName(),
            'number' => count($selectedTiles),
            'color' => $this->getColor($tile->type),   
            'i18n' => ['color'],           
            'type' => $tile->type,
            'preserve' => [ 2 => 'type' ],
            'selectedTiles' => $selectedTiles,
            'discardedTiles' => $discardedTiles,
            'fromFactory' => $factory,
        ]);

        if ($takeFromSpecialFactoryZero) {
            $this->notifyAllPlayers('moveSpecialFactoryZero', '', [
                'playerId' => $playerId,
            ]);
        }

        $this->setGlobalVariable(UNDO_SELECT, new Undo(
            array_merge($selectedTiles, $discardedTiles, $firstPlayerTokens),
            $factory, 
            $previousFirstPlayer,
            null,
            $takeFromSpecialFactoryZero
        ));

        $transition = 'placeTiles';
        $this->setGlobalVariable(UNDO_FACTORY, null);
        if ($specialFactories !== null && array_key_exists($factory, $specialFactories) && $specialFactories[$factory] == 7) {
            $remainingFactoryTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $factory));
            if (count($remainingFactoryTiles) > 0) {
                $this->setGlobalVariable(UNDO_FACTORY, new Undo($remainingFactoryTiles, $factory));
                $transition = 'chooseFactory';
            }
        }

        $this->gamestate->nextState($transition);
    }

    function actUndoTakeTiles() {
        /*if (!$this->isUndoActivated()) {
            throw new BgaUserException('Undo is disabled');
        }*/        
        $playerId = $this->getActivePlayerId();

        $undoFactory = $this->getGlobalVariable(UNDO_FACTORY);
        if ($undoFactory != null) {
            $otherFactories = [];
            foreach($undoFactory->tiles as $tile) {
                $currentFactory = $this->getTileFromDb($this->tiles->getCard($tile->id))->column;
                if ($currentFactory != $undoFactory->from && !in_array($currentFactory, $otherFactories)) {
                    $otherFactories[] = $currentFactory;
                }
            }

            $this->tiles->moveCards(array_map('getIdPredicate', $undoFactory->tiles), 'factory', $undoFactory->from);

            $partialFactories = [
                $undoFactory->from => $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $undoFactory->from)),
            ];
    
            $this->notifyAllPlayers("factoriesChanged", '', [
                'factory' => $undoFactory->from,
                'factories' => $partialFactories,
                'tiles' => $undoFactory->tiles,
            ]);
            foreach($otherFactories as $otherFactory) {
                $partialFactories = [
                    $otherFactory => $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $otherFactory)),
                ];    
                $this->notifyAllPlayers("factoriesChanged", '', [
                    'factory' => $otherFactory,
                    'factories' => $partialFactories,
                    'tiles' => [],
                ]);
            }
        }

        $undo = $this->getGlobalVariable(UNDO_SELECT);

        if (property_exists($undo, 'takeFromSpecialFactoryZero') && $undo->takeFromSpecialFactoryZero) {
            $this->setGameStateValue(SPECIAL_FACTORY_ZERO_OWNER, 0);
            $this->notifyAllPlayers('moveSpecialFactoryZero', '', [
                'playerId' => 0,
            ]);
        }

        $factoryTilesBefore = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $undo->from));
        $this->tiles->moveCards(array_map('getIdPredicate', $undo->tiles), 'factory', $undo->from);
        $this->setGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN, $undo->previousFirstPlayer);

        $this->notifyAllPlayers('undoTakeTiles', clienttranslate('${player_name} cancels tile selection'), [
            'playerId' => $playerId,
            'player_name' => $this->getActivePlayerName(),
            'undo' => $undo,
            'factoryTilesBefore' => $factoryTilesBefore,
            'repositionTiles' => $undoFactory != null,
        ]);

        $this->gamestate->nextState('undo');
    }

    function actSelectFactory(int $factory) {
        $args = $this->argChooseFactory();

        $this->tiles->moveCards(array_map('getIdPredicate', $args['tiles']), 'factory', $factory);

        $partialFactories = [
            $factory => $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $factory)),
        ];

        $this->notifyAllPlayers("factoriesChanged", '', [
            'factory' => $factory,
            'factories' => $partialFactories,
            'tiles' => $args['tiles'],
        ]);

        $args = $this->argChooseFactory();
        $this->gamestate->nextState($args['type'] !== null ? 'nextFactory' : 'chooseLine');
    }

    function actSelectLine(int $line) {
        $playerId = $this->getActivePlayerId();

        if (array_search($line, $this->availableLines($playerId)) === false) {
            throw new BgaUserException('Line not available');
        }

        $tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('hand', $playerId));
        $this->placeTilesOnLine($playerId, $tiles, $line, true);

        $lastRoundLogged = intval($this->getGameStateValue(END_TURN_LOGGED)) > 0;
        if ($this->lineWillBeComplete($playerId, $line) && !$lastRoundLogged) {
            $this->notifyAllPlayers('lastRound', clienttranslate('${player_name} will complete a line, it\'s last turn !'), [
                'playerId' => $playerId,
                'player_name' => $this->getActivePlayerName(),
            ]);
            $this->setGameStateValue(END_TURN_LOGGED, 1);
        }

        $this->setGlobalVariable(UNDO_PLACE, new Undo($tiles, null, null, $lastRoundLogged));

        if ($this->isUndoActivated($playerId)) {
            $this->gamestate->nextState('confirm');
        } else {
            $this->gamestate->nextState('nextPlayer');
        }
    }

    function actConfirmLine() {
        $this->gamestate->nextState('nextPlayer');
    }
    
    function actUndoSelectLine() {
        $playerId = intval($this->getActivePlayerId());       

        $undo = $this->getGlobalVariable(UNDO_PLACE);

        $this->tiles->moveCards(array_map('getIdPredicate', $undo->tiles), 'hand', $playerId);

        $lastRoundLogged = intval($this->getGameStateValue(END_TURN_LOGGED)) > 0;
        if ($lastRoundLogged && !$undo->lastRoundBefore) {
            $this->setGameStateValue(END_TURN_LOGGED, 0);
        }

        $this->notifyAllPlayers('undoSelectLine', clienttranslate('${player_name} cancels tile placement'), [
            'playerId' => $playerId,
            'player_name' => $this->getActivePlayerName(),
            'undo' => $undo,
        ]);
        
        $this->gamestate->nextState('undo');
    }

    function actSelectColumn(int $line, int $column) {
        $playerId = intval($this->getCurrentPlayerId());

        $this->setSelectedColumn($playerId, $line, $column);

        $arg = (object)$this->argChooseColumnForPlayer($playerId);

        $this->notifyPlayer($playerId, 'updateSelectColumn', '', [
            'playerId' => $playerId,
            'arg' => $arg,
        ]);

        if (intval($this->gamestate->state_id()) == ST_MULTIPLAYER_PRIVATE_CHOOSE_COLUMNS) {
            $confirm = $arg->nextColumnToSelect === null;
            $this->gamestate->nextPrivateState($playerId, $confirm ? 'confirm' : 'next');
        }
    }

    function actConfirmColumns() {
        $playerId = intval($this->getCurrentPlayerId());

        // Make this player unactive now (and tell the machine state to use transtion "placeTiles" if all players are now unactive
        $this->gamestate->setPlayerNonMultiactive($playerId, 'confirmColumns');
    }

    function actUndoColumns() {
        $playerId = intval($this->getCurrentPlayerId());

        $this->DbQuery("UPDATE player SET selected_columns = '[]' WHERE player_id = $playerId");
        
        $this->notifyPlayer($playerId, 'updateSelectColumn', '', [
            'playerId' => $playerId,
            'arg' => $this->argChooseColumnForPlayer($playerId),
            'undo' => true,
        ]);

        $this->gamestate->nextPrivateState($playerId, 'undo');
    }

}
