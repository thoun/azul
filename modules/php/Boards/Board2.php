<?php
declare(strict_types=1);

namespace Bga\Games\Azul\Boards;

// base game: gray side
class Board2 extends Board {

    public function getFixedColors(): ?array {
        return [];
    }
}