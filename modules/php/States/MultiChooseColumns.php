<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\StateType;
use Bga\Games\Azul\Game;

class MultiChooseColumns extends \Bga\GameFramework\States\GameState
{
    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_MULTIPLAYER_PRIVATE_CHOOSE_COLUMNS, 
            type: StateType::MULTIPLE_ACTIVE_PLAYER,
            name: 'multiChooseColumns',
            description: clienttranslate('Players with complete lines must choose columns to place tiles'),
            descriptionMyTurn: '',
            initialPrivate: PrivateChooseColumn::class,
            transitions: [
                "confirmColumns" => PlaceTiles::class,
            ],
        );
    }

    function onEnteringState() {
        $this->gamestate->setAllPlayersMultiactive();
        $this->gamestate->initializePrivateStateForAllActivePlayers(); 
    }

    public function zombie(int $playerId) {
    }
}
