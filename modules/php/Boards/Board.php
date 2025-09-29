<?php
declare(strict_types=1);

namespace Bga\Games\Azul\Boards;

abstract class Board {
    public function getSetPoints(): array {
        return [
            'line' => 2,
            'column' => 7,
            'color' => 10,
        ];
    }

    public function getFixedColors(): ?array {
        return null;
    }
}