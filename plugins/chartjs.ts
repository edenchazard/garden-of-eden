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
} from 'chart.js';

export default defineNuxtPlugin(() => {
  Chart.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineController,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
  );

  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.title.display = true;
  Chart.defaults.scales.linear.ticks.precision = 0;
  Chart.defaults.datasets.line.tension = 0.25;
  Chart.defaults.datasets.line.pointBorderWidth = 6;
});

export * from 'chart.js';
