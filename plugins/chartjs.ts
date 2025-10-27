import {
  Chart,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Filler,
  TimeScale,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

export default defineNuxtPlugin(() => {
  Chart.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineController,
    LineElement,
    PointElement,
    TimeScale,
    Title,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin,
    {
      id: 'corsair',
      defaults: {
        width: 1,
        color: 'rgba(255, 0, 255, 0.5)',
        dash: [5, 5],
      },
      afterInit: (chart) => {
        // @ts-expect-error I ain't dealing with that
        chart.corsair = {
          x: 0,
          y: 0,
        };
      },
      afterEvent: (chart, args) => {
        const { inChartArea } = args;
        const { x, y } = args.event;

        // @ts-expect-error I ain't dealing with that
        chart.corsair = { x, y, draw: inChartArea };
        chart.draw();
      },
      afterDatasetsDraw: (chart, _, opts) => {
        const { ctx } = chart;
        const { top, bottom, left, right } = chart.chartArea;
        // @ts-expect-error I ain't dealing with that
        if (!chart.corsair) return;
        // @ts-expect-error I ain't dealing with that
        const { x, y, draw } = chart.corsair;
        if (!draw) return;

        ctx.save();

        ctx.beginPath();
        ctx.lineWidth = opts.width;
        ctx.strokeStyle = opts.color;
        ctx.setLineDash(opts.dash);
        ctx.moveTo(x, bottom);
        ctx.lineTo(x, top);
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();

        ctx.restore();
      },
    }
  );

  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.title.display = true;
  Chart.defaults.datasets.line.tension = 0.25;
  Chart.defaults.datasets.line.pointBorderWidth = 4;
});

export * from 'chart.js';
