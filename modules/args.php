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

        return [
            'lines' => $this->availableLines($playerId),
            'number' => count($tiles),
            'color' => $this->getColor($tiles[0]->type),
            'type' => $tiles[0]->type,
        ];
    }

    function argChooseColumn() {
        $playersIds = $this->getPlayersIds();
        $line = intval(self::getGameStateValue(RESOLVING_LINE));

        $playersIdsWithCompleteLine = [];
        $playersIdsWithColor = [];

        foreach ($playersIds as $playerId) {
            $playerTiles = $this->getTilesFromLine($playerId, $line);
            if (count($playerTiles) == $line) {
                $columns = $this->getAvailableColumnForColor($playerId, $playerTiles[0]->type, $line);
                $playersIdsWithCompleteLine[$playerId] = $columns;
                $playersIdsWithColor[$playerId] = $playerTiles[0]->type;
            }
        }

        return [
            'line' => $line,
            'columns' => $playersIdsWithCompleteLine,
            'colors' => $playersIdsWithColor,
        ];
    }

}