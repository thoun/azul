<?php
declare(strict_types=1);

namespace Bga\Games\Azul\Objects;

class Undo {
    public function __construct(
        public array $tiles = [], 
        public ?int $from = null, 
        public ?int $previousFirstPlayer = null, 
        public ?bool $lastRoundBefore = null,
        public ?bool $takeFromSpecialFactoryZero = null,
        public ?int $moveId = null,
    ) {
    }
}
?>
