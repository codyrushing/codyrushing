import throttle from 'lodash.throttle';
import Emittery from 'emittery';

export const eventBus = new Emittery<{}>();

export default function createCrystalCave(canvas:HTMLCanvasElement){
    window.addEventListener('resize', throttle(
        function onThrottledWindowResize(){
        // resize
        }, 300)
    );


}