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

        $factoryNumber = $this->getFactoryNumber();
        for ($factory=1; $factory<=$factoryNumber; $factory++) {
            $factories[$factory] = $this->getTilesFromDb($this->tiles->pickCardsForLocation(4, 'deck', 'factory', $factory));
        }

        self::notifyAllPlayers("factoriesFilled", clienttranslate("A new round begins !"), [
            'factories' => $factories,
            'remainingTiles' => intval($this->tiles->countCardInLocation('deck')),
        ]);

        self::incStat(1, 'roundsNumber');
        self::incStat(1, 'firstPlayer', intval(self::getGameStateValue(FIRST_PLAYER_FOR_NEXT_TURN)));

        if ($this->isVariant()) {
            self::DbQuery("UPDATE player SET selected_columns = '{}'");
        }

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

            for ($line = 1; $line <= 5; $line++) {
                if (!array_key_exists($line, $selectedColumns)) {
                    $playerTiles = $this->getTilesFromLine($playerId, $line);
                    if (count($playerTiles) == $line) {
                        $availableColumns = $this->getAvailableColumnForColor($playerId, $playerTiles[0]->type, $line);

                        if (count($availableColumns) > 1) {                        
                            if (!array_key_exists($playerId, $playersIdsWithCompleteLines)) {                   
                                $playersIdsWithCompleteLines[] = $playerId;
                            }
                        } else {
                            // if only one possibility, it's automaticaly selected
                            $this->setSelectedColumn($playerId, $line, $availableColumns[0]);
                        }
                    }
                }
            }
        }

        if (count($playersIdsWithCompleteLines) > 0) {
            $this->gamestate->setPlayersMultiactive($playersIdsWithCompleteLines, 'placeTiles');
        } else {
            $this->gamestate->nextState('placeTiles');
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
