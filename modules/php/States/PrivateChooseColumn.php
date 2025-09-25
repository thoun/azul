<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\Azul\Game;

class PrivateChooseColumn extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_PRIVATE_CHOOSE_COLUMNS, 
            type: StateType::PRIVATE,
            name: 'privateChooseColumns',
            descriptionMyTurn: clienttranslate('${you} must choose columns to place tiles'),
            transitions: [
                "next" => ST_PRIVATE_CHOOSE_COLUMNS,
                "undo" => ST_PRIVATE_CHOOSE_COLUMNS,
                "confirm" => ST_PRIVATE_CONFIRM_COLUMNS,
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
    function actSelectColumn(int $line, int $column, int $currentPlayerId) {
        $this->game->setSelectedColumn($currentPlayerId, $line, $column);

        $arg = $this->game->argChooseColumnForPlayer($currentPlayerId);

        $this->notify->player($currentPlayerId, 'updateSelectColumn', '', [
            'playerId' => $currentPlayerId,
            'arg' => $arg,
        ]);

        $confirm = $arg->nextColumnToSelect === null;
        $this->gamestate->nextPrivateState($currentPlayerId, $confirm ? 'confirm' : 'next');
    }

    #[PossibleAction]
    function actConfirmColumns(int $currentPlayerId) {
        $this->gamestate->setPlayerNonMultiactive($currentPlayerId, 'confirmColumns');
    }

    #[PossibleAction]
    function actUndoColumns(int $currentPlayerId) {
        return $this->game->actUndoColumns($currentPlayerId);
    }

    public function zombie(int $playerId) {
        $args = $this->game->argChooseColumnForPlayer($playerId);

        $availableColumns = $args->nextColumnToSelect->availableColumns;
        $zombieChoice = $this->getRandomZombieChoice($availableColumns);

       return $this->actSelectColumn($args->nextColumnToSelect->line, $zombieChoice, $playerId);
    }
}
