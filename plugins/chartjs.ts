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
    Filler
  );

  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.title.display = true;
  Chart.defaults.datasets.line.tension = 0.25;
  Chart.defaults.datasets.line.pointBorderWidth = 4;
});

export * from 'chart.js';
