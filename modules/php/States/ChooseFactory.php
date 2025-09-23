<?php
declare(strict_types=1);

namespace Bga\Games\Azul\States;

use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\Azul\Game;

class ChooseFactory extends \Bga\GameFramework\States\GameState
{

    public function __construct(protected Game $game) {
        parent::__construct($game, 
            id: ST_PLAYER_CHOOSE_FACTORY, 
            type: StateType::ACTIVE_PLAYER,
            name: 'chooseFactory',
            description: clienttranslate('${actplayer} must choose a neighbor factory to place remaining ${number} ${color}'),
            descriptionMyTurn: clienttranslate('${you} must choose a neighbor factory to place remaining ${number} ${color}'),
        );
    }

    function getArgs() {
        $undo = $this->game->getGlobalVariable(UNDO_FACTORY);
        $factory = $undo->from;
        $remainingFactoryTiles = $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('factory', $factory));
        $tiles = Arrays::filter($remainingFactoryTiles, fn($tile) => $tile->type == $remainingFactoryTiles[0]->type);

        $number = count($tiles);

        $specialFactories = $this->game->isSpecialFactories() ? $this->game->getSpecialFactories() : null;
        $factoryNumber = $this->game->getFactoryNumber();
        $specialFactoryZeroOwner = intval($this->game->getGameStateValue(SPECIAL_FACTORY_ZERO_OWNER));
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
            'color' => $number > 0 ? $this->game->getColor($tiles[0]->type) : null,
            'i18n' => ['color'],
            'type' => $number > 0 ? $tiles[0]->type : null,
            'tiles' => $tiles,
            'possibleFactories' => $possibleFactories,
        ];
    }

    #[PossibleAction]
    function actSelectFactory(int $factory, array $args) {
        $this->game->tiles->moveCards(array_map(fn($t) => $t->id, $args['tiles']), 'factory', $factory);

        $partialFactories = [
            $factory => $this->game->getTilesFromDb($this->game->tiles->getCardsInLocation('factory', $factory)),
        ];

        $this->notify->all("factoriesChanged", '', [
            'factory' => $factory,
            'factories' => $partialFactories,
            'tiles' => $args['tiles'],
        ]);

        $args = $this->getArgs();
        return $args['type'] !== null ? ChooseFactory::class : ChooseLine::class;
    }

    #[PossibleAction]
    function actUndoTakeTiles(int $activePlayerId) {
        return $this->game->actUndoTakeTiles($activePlayerId);
    }

    public function zombie(int $playerId) {
        $args = $this->getArgs();
        $possibleFactories = $args['possibleFactories'];
        $zombieChoice = $this->getRandomZombieChoice($possibleFactories);
        return $this->actSelectFactory($zombieChoice, $args);
    }
}
