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
            descriptionMyTurn: clienttranslate('${you} must choose columns to place tiles'),
            transitions: [
                "undo" => ST_PRIVATE_CHOOSE_COLUMNS,
                "confirmColumns" => ST_PLACE_TILES,
            ],
        );
    }

    function getArgs(int $playerId) {
        return (array)$this->game->argChooseColumnForPlayer($playerId);
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
