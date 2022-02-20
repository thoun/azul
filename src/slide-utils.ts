function slideToObjectAndAttach(game: AzulGame, object: HTMLElement, destinationId: string, posX?: number, posY?: number, rotation: number = 0): Promise<boolean> {
    const destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return Promise.resolve(true);
    }

    return new Promise(resolve => {
        const originalZIndex = Number(object.style.zIndex);
        object.style.zIndex = '10';

        const objectCR = object.getBoundingClientRect();
        const destinationCR = destination.getBoundingClientRect();

        const deltaX = destinationCR.left - objectCR.left + (posX ?? 0) * game.getZoom();
        const deltaY = destinationCR.top - objectCR.top + (posY ?? 0) * game.getZoom();

        const attachToNewParent = () => {
            object.style.top = posY !== undefined ? `${posY}px` : 'unset';
            object.style.left = posX !== undefined ? `${posX}px` : 'unset';
            object.style.position = (posX !== undefined || posY !== undefined) ? 'absolute' : 'relative';
            object.style.zIndex = originalZIndex ? ''+originalZIndex : 'unset';
            object.style.transform = rotation ? `rotate(${rotation}deg)` : 'unset';
            object.style.transition = 'unset';
            destination.appendChild(object);
        }

        if (document.visibilityState === 'hidden' || (game as any).instantaneousMode) {
            // if tab is not visible, we skip animation (else they could be delayed or cancelled by browser)
            attachToNewParent();
        } else {
            object.style.transition = `transform 0.5s ease-in`;
            object.style.transform = `translate(${deltaX / game.getZoom()}px, ${deltaY / game.getZoom()}px) rotate(${rotation}deg)`;

            let securityTimeoutId = null;

            const transitionend = () => {
                attachToNewParent();
                object.removeEventListener('transitionend', transitionend);
                object.removeEventListener('transitioncancel', transitionend);
                resolve(true);

                if (securityTimeoutId) {
                    clearTimeout(securityTimeoutId);
                }
            };

            object.addEventListener('transitionend', transitionend);
            object.addEventListener('transitioncancel', transitionend);

            // security check : if transition fails, we force tile to destination
            securityTimeoutId = setTimeout(() => {
                if (!destination.contains(object)) {
                    attachToNewParent();
                    object.removeEventListener('transitionend', transitionend);
                    object.removeEventListener('transitioncancel', transitionend);
                    resolve(true);
                }
            }, 700);
        }
    });
}