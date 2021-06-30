function slideToObjectAndAttach(game: Game, object: HTMLElement, destinationId: string, posX?: number, posY?: number) {
    const destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return;
    }

    object.style.zIndex = '10';
    const animation = (posX !== undefined || posY !== undefined) ? 
        (game as any).slideToObjectPos(object, destinationId, posX, posY) :
        (game as any).slideToObject(object, destinationId);

    dojo.connect(animation, 'onEnd', dojo.hitch(this, () => {
        object.style.top = posY !== undefined ? `${posY}px` : 'unset';
        object.style.left = posX !== undefined ? `${posX}px` : 'unset';
        object.style.position = (posX !== undefined || posY !== undefined) ? 'absolute' : 'relative';
        object.style.zIndex = 'unset';
        destination.appendChild(object);
    }));
    animation.play();
}