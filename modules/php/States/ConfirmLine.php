<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Azul\Game;

class ConfirmLine extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_PLAYER_CONFIRM_LINE, 
            type: StateType::ACTIVE_PLAYER,
            name: 'confirmLine',
            description: clienttranslate('${actplayer} must confirm line choice'),
            descriptionMyTurn: clienttranslate('${you} must confirm line choice'),
        );
    }

    #[PossibleAction]
    function actConfirmLine() {
        return NextPlayer::class;
    }
    
    #[PossibleAction]
    function actUndoSelectLine(int $activePlayerId) {
        $undo = $this->game->getGlobalVariable(UNDO_PLACE);

        $this->game->tiles->moveCards(array_map(fn($t) => $t->id, $undo->tiles), 'hand', $activePlayerId);

        $lastRoundLogged = intval($this->game->getGameStateValue(END_TURN_LOGGED)) > 0;
        if ($lastRoundLogged && !$undo->lastRoundBefore) {
            $this->game->setGameStateValue(END_TURN_LOGGED, 0);
        }

        $this->notify->all('undoSelectLine', clienttranslate('${player_name} cancels tile placement'), [
            'playerId' => $activePlayerId,
            'player_name' => $this->game->getPlayerNameById($activePlayerId),
            'undo' => $undo,
        ]);
        
        return ChooseLine::class;
    }

    public function zombie(int $playerId) {
        return $this->actConfirmLine();
    }
}
