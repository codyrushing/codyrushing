
import * as PIXI from 'pixi.js' 
import * as D3Shape from 'd3-shape';

export default function createBackgroundViz(canvas:HTMLCanvasElement){
  const app = new PIXI.Application({ view: canvas, backgroundAlpha: 0, antialias: true, resizeTo: window });  
  const { width, height } = app.view;
  console.log(width);
  console.log(height);
  const graphics = new PIXI.Graphics();

  graphics.lineStyle(1, '#fff', 0.5);
  graphics.moveTo(width/2, 0);
  graphics.quadraticCurveTo(
    width/3, height,
    width/2, height
  );

  app.stage.addChild(graphics);

  app.ticker.add(function onFrame(){

  });
}