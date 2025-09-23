<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Azul\Game;

class PrivateConfirmColumns extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_PRIVATE_CONFIRM_COLUMNS, 
            type: StateType::PRIVATE,
            name: 'privateConfirmColumns',
            descriptionMyTurn: clienttranslate('${you} must must choose columns to place tiles'),
            transitions: [
                "undo" => ST_PRIVATE_CHOOSE_COLUMNS,
                "confirmColumns" => ST_PLACE_TILES,
            ],
        );
    }

    function getArgs(int $playerId) {
        return (array)$this->game->argChooseColumnForPlayer($playerId);
    }

    function onEnteringState(int $playerId) {
        $selectedColumns = $this->game->getSelectedColumns($playerId);
        $disablePlayer = true;
        
        for ($line = 1; $line <= 5; $line++) {
            if (!array_key_exists($line, $selectedColumns)) {
                $playerTiles = $this->game->getTilesFromLine($playerId, $line);
                if (count($playerTiles) == $line) {
                    $availableColumns = $this->game->getAvailableColumnForColor($playerId, $playerTiles[0]->type, $line);

                    if (count($availableColumns) > 1) {
                        $disablePlayer = false;
                    } else {
                        // if only one possibility, it's automaticaly selected
                        $this->game->setSelectedColumn($playerId, $line, $availableColumns[0]);

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

    #[PossibleAction]
    function actConfirmColumns(int $currentPlayerId) {
        return $this->gamestate->setPlayerNonMultiactive($currentPlayerId, 'confirmColumns');
    }

    #[PossibleAction]
    function actUndoColumns(int $currentPlayerId) {
        return $this->game->actUndoColumns($currentPlayerId);
    }

    public function zombie(int $playerId) {
        return $this->actConfirmColumns($playerId);
    }
}
