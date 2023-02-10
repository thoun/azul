<?php

trait StateTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Game state actions
    ////////////
    
    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stFillFactories() {
        $factories = [];

        $firstPlayerTile = $this->getTilesFromDb($this->tiles->getCardsOfType(0, null))[0];
        $this->tiles->moveCard($firstPlayerTile->id, 'factory', 0);
        $factories[0] = [$firstPlayerTile];

        $specialFactories = null;
        if ($this->isSpecialFactories()) {
            $specialFactories = $this->getSpecialFactories();
        }

        $factoryNumber = $this->getFactoryNumber();
        for ($factory=1; $factory<=$factoryNumber; $factory++) {
            $tilesNumber = 4;
            if ($specialFactories !== null && array_key_exists($factory, $specialFactories) && $specialFactories[$factory] == 9) {
                $tilesNumber = 5;
            }
            $factories[$factory] = $this->getTilesFromDb($this->tiles->pickCardsForLocation($tilesNumber, 'deck', 'factory', $factory));
        }

        if ($this->isVariant()) {
            self::DbQuery("UPDATE player SET selected_columns = '{}'");

            $lastRoundLogged = intval(self::getGameStateValue(END_TURN_LOGGED)) > 0;
            if ($lastRoundLogged) {
                self::setGameStateValue(END_TURN_LOGGED, 0);
                self::notifyAllPlayers('removeLastRound', '', []);
            }
        }

        self::notifyAllPlayers("factoriesFilled", clienttranslate("A new round begins !"), [
            'factories' => $factories,
            'remainingTiles' => intval($this->tiles->countCardInLocation('deck')),
        ]);

        for ($factory=1; $factory<=$factoryNumber; $factory++) {
            if ($specialFactories !== null && array_key_exists($factory, $specialFactories) && $specialFactories[$factory] <= 5) {
                $seekedColor = $specialFactories[$factory];
                $previous = $factory == 1 ? $factoryNumber : $factory - 1;
                $next = $factory == $factoryNumber ? 1 : $factory + 1;
                $previousTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $previous));
                $nextTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $next));
                $takenPreviousTile = $this->array_find($previousTiles, fn($tile) => $tile->type == $seekedColor);
                $takenNextTile = $this->array_find($nextTiles, fn($tile) => $tile->type == $seekedColor);

                if ($takenPreviousTile !== null) {
                    $this->tiles->moveCard($takenPreviousTile->id, 'factory', $factory);
                }
                if ($takenNextTile !== null) {
                    $this->tiles->moveCard($takenNextTile->id, 'factory', $factory);
                }

                $partialFactories = [
                    $factory => $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $factory)),
                ];

                if ($takenPreviousTile !== null) {
                    $partialFactories[$previous] = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $previous));
                }
                if ($takenNextTile !== null) {
                    $partialFactories[$next] = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $next));
                }
                self::notifyAllPlayers("factoriesChanged", '', [
                    'factory' => $factory,
                    'factories' => $partialFactories,
                    'previousTile' => $takenPreviousTile,
                    'nextTile' => $takenNextTile,
                ]);
            }
        }

        self::incStat(1, 'roundsNumber');
        self::incStat(1, 'firstPlayer', intval(self::getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN)));
        
        // TODO TEMP
        //$this->debugPlayRandomlyToTen();

        $this->gamestate->nextState('next');
    }

    function stConfirmLine() {
        if (!$this->allowUndo()) {
            $this->gamestate->nextState('nextPlayer');
        }
    }

    function stNextPlayer() {
        $factoriesAllEmpty = $this->tiles->countCardInLocation('factory') == 0;
        $playerId = self::getActivePlayerId();

        self::incStat(1, 'turnsNumber');
        self::incStat(1, 'turnsNumber', $playerId);

        if ($factoriesAllEmpty) {
            $this->gamestate->nextState('endRound');
        } else {
            $this->activeNextPlayer();
        
            $playerId = self::getActivePlayerId();
            self::giveExtraTime($playerId);

            $this->gamestate->nextState('nextPlayer');
        }
    }

    function stEndRound() {
        if ($this->isVariant()) {
            $this->gamestate->nextState('chooseColumns');
        } else {
            $this->gamestate->nextState('placeTiles');
        }
    }

    function stChooseColumns() {
        $playersIds = $this->getPlayersIds();

        $playersIdsWithCompleteLines = [];

        foreach ($playersIds as $playerId) {
            $selectedColumns = $this->getSelectedColumns($playerId);

            $canAutoSelect = true;

            for ($line = 1; $line <= 5; $line++) {
                if (!array_key_exists($line, $selectedColumns)) {
                    $playerTiles = $this->getTilesFromLine($playerId, $line);
                    if (count($playerTiles) == $line) {
                        $availableColumns = $this->getAvailableColumnForColor($playerId, $playerTiles[0]->type, $line);

                        if (count($availableColumns) > 1) {                        
                            if (!array_key_exists($playerId, $playersIdsWithCompleteLines)) {                   
                                $playersIdsWithCompleteLines[] = $playerId;
                                $canAutoSelect = false;
                            }
                        } else if ($canAutoSelect) {
                            // if only one possibility, it's automaticaly selected
                            $this->setSelectedColumn($playerId, $line, $availableColumns[0]);
                        }
                    }
                }
            }
        }

        if (count($playersIdsWithCompleteLines) > 0) {
            $this->gamestate->setPlayersMultiactive($playersIdsWithCompleteLines, 'confirmColumns');
        } else {
            $this->gamestate->nextState('confirmColumns');
        }
    }

    function stMultiChooseColumns() {
        $this->gamestate->setAllPlayersMultiactive();
        $this->gamestate->initializePrivateStateForAllActivePlayers(); 
    }

    function stPrivateChooseColumns(int $playerId) {
        $selectedColumns = $this->getSelectedColumns($playerId);
        $disablePlayer = true;
        
        for ($line = 1; $line <= 5; $line++) {
            if (!array_key_exists($line, $selectedColumns)) {
                $playerTiles = $this->getTilesFromLine($playerId, $line);
                if (count($playerTiles) == $line) {
                    $availableColumns = $this->getAvailableColumnForColor($playerId, $playerTiles[0]->type, $line);

                    if (count($availableColumns) > 1) {
                        $disablePlayer = false;
                    } else {
                        // if only one possibility, it's automaticaly selected
                        $this->setSelectedColumn($playerId, $line, $availableColumns[0]);

                        if ($line < 5) {
                            $this->gamestate->nextPrivateState($playerId, 'next');
                            return;
                        }
                    }
                }
            }
        }

        if ($disablePlayer) {
            $this->gamestate->setPlayerNonMultiactive($playerId, 'confirmColumns');
        }
    }

    function stPlaceTiles() {
        $playersIds = $this->getPlayersIds();

        $this->notifPlaceLines($playersIds);
    
        $firstPlayerTile = $this->getTilesFromDb($this->tiles->getCardsOfType(0))[0];
        $this->tiles->moveCard($firstPlayerTile->id, 'factory', 0);

        if ($this->getGameProgression() == 100) {
            $this->gamestate->nextState('endScore');
        } else {
            $playerId = intval(self::getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN));
            $this->gamestate->changeActivePlayer($playerId);
            self::giveExtraTime($playerId);

            $this->gamestate->nextState('newRound');
        }
    }

    private function endScoreNotifs(array $playersIds, array $walls) {
        // Gain 2 points for each complete horizontal line of 5 consecutive tiles on your wall.
        for ($line = 1; $line <= 5; $line++) {
            $this->notifCompleteLines($playersIds, $walls, $line);
        }
        // Gain 7 points for each complete vertical line of 5 consecutive tiles on your wall.
        for ($column = 1; $column <= 5; $column++) {
            $this->notifCompleteColumns($playersIds, $walls, $column);
        }
        // Gain 10 points for each color of which you have placed all 5 tiles on your wall.
        for ($color = 1; $color <= 5; $color++) {
            $this->notifCompleteColors($playersIds, $walls, $color);
        }
    }

    function stEndScore() {
        $playersIds = $this->getPlayersIds();

        $walls = [];
        foreach ($playersIds as $playerId) {
            $walls[$playerId] = $this->getTilesFromDb($this->tiles->getCardsInLocation('wall'.$playerId));
        }
        
        $fastScoring = $this->isFastScoring();
        if ($fastScoring) {
            $this->endScoreNotifs($playersIds, $walls);
        } else {
            foreach($playersIds as $playerId) {
                $this->endScoreNotifs([$playerId], $walls);
            }
        }

        //$this->gamestate->jumpToState(ST_FILL_FACTORIES);
        $this->gamestate->nextState('endGame');
    }
    
}
