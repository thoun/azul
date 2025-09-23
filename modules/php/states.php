<?php

trait StateTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Game state actions
    ////////////
    
    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stConfirmLine() {
        $playerId = (int)$this->getActivePlayerId();
        if (!$this->isUndoActivated($playerId)) {
            $this->gamestate->nextState('nextPlayer');
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
    
}
