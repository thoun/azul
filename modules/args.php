<?php

trait ArgsTrait {
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    function argChooseLine() {
        $playerId = self::getActivePlayerId();
        $tiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('hand', $playerId));

        $number = count($tiles);

        return [
            'lines' => $this->availableLines($playerId),
            'number' => $number,
            'color' => $number > 0 ? $this->getColor($tiles[0]->type) : null,
            'i18n' => ['color'],
            'type' => $number > 0 ? $tiles[0]->type : null,
        ];
    }

    function nextColumnToSelect(int $playerId) {
        $selectedColumns = $this->getSelectedColumns($playerId);

        for ($line = 1; $line <= 5; $line++) {
            if (!array_key_exists($line, $selectedColumns)) {
                $playerTiles = $this->getTilesFromLine($playerId, $line);
                if (count($playerTiles) == $line) {
                    $availableColumns = $this->getAvailableColumnForColor($playerId, $playerTiles[0]->type, $line);

                    if (count($availableColumns) > 1) {
                        $lineInfos = new stdClass();
                        $lineInfos->color = $playerTiles[0]->type;
                        $lineInfos->availableColumns = $availableColumns;
                        $lineInfos->line = $line;
                        return $lineInfos;
                    } else {
                        // if only one possibility, it's automaticaly selected
                        $this->setSelectedColumn($playerId, $line, $availableColumns[0]);
                    }
                }
            }
        }
        return null;
    }

    function getSelectedColumnsArray(int $playerId) {
        $result = [];
        $selectedColumns = $this->getSelectedColumns($playerId);
        foreach($selectedColumns as $line => $column) {
            $selectedColumn = new stdClass();
            $selectedColumn->line = $line;
            $selectedColumn->column = $column;
            $tiles = $this->getTilesFromLine($playerId, $line);
            if (count($tiles) > 0) {
                $selectedColumn->type = $tiles[0]->type;
                $selectedColumn->color = $selectedColumn->type;
            }
            $result[] = $selectedColumn;
        }

        return $result;
    }

    function argChooseColumnForPlayer(int $playerId) {
        $playerArg = new stdClass();
        $playerArg->nextColumnToSelect = $this->nextColumnToSelect($playerId);
        $playerArg->selectedColumns = $this->getSelectedColumnsArray($playerId);

        return $playerArg;
    }

    function argChooseColumns() {
        $playersIds = $this->getPlayersIds();

        $players = [];

        foreach ($playersIds as $playerId) {
            $players[$playerId] = $this->argChooseColumnForPlayer($playerId);
        }

        return [
            'players' => $players,
        ];
    }

}