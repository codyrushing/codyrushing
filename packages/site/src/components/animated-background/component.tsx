import { h, createRef } from 'preact';
import { useEffect } from 'preact/hooks';
import backgroundViz from './background-viz';

export default function Viz() {
  const ref = createRef();

  useEffect(() => {
    backgroundViz(ref.current);
  }, []);

	return <canvas ref={ref} class="animated-bg fixed inset-0 z-0"></canvas>
}