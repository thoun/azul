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

    function argChooseFactory() {
        $undo = $this->getGlobalVariable(UNDO_FACTORY);
        $factory = $undo->from;
        $remainingFactoryTiles = $this->getTilesFromDb($this->tiles->getCardsInLocation('factory', $factory));
        $tiles = array_values(array_filter($remainingFactoryTiles, fn($tile) => $tile->type == $remainingFactoryTiles[0]->type));

        $number = count($tiles);

        $specialFactories = $this->isSpecialFactories() ? $this->getSpecialFactories() : null;
        $factoryNumber = $this->getFactoryNumber();
        $specialFactoryZeroOwner = intval($this->getGameStateValue(SPECIAL_FACTORY_ZERO_OWNER));
        $previous = $factory == 1 ? $factoryNumber : $factory - 1;
        if ($specialFactoryZeroOwner > 0 && $specialFactories !== null && array_key_exists($previous, $specialFactories) && $specialFactories[$previous] == 6) {
            $previous = $previous == 1 ? $factoryNumber : $previous - 1;
        }
        $next = $factory == $factoryNumber ? 1 : $factory + 1;
        if ($specialFactoryZeroOwner > 0 && $specialFactories !== null && array_key_exists($next, $specialFactories) && $specialFactories[$next] == 6) {
            $next = $next == 1 ? $factoryNumber : $next - 1;
        }
        $possibleFactories = [$previous, $next];

        return [
            'factory' => $factory,
            'number' => $number,
            'color' => $number > 0 ? $this->getColor($tiles[0]->type) : null,
            'i18n' => ['color'],
            'type' => $number > 0 ? $tiles[0]->type : null,
            'tiles' => $tiles,
            'possibleFactories' => $possibleFactories,
        ];
    }

    function argChooseLine() {
        $playerId = $this->getActivePlayerId();
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

        return (array)$playerArg;
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