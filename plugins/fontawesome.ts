// For Nuxt 3
import { library, config } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faRotate,
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faMars,
  faVenus,
  faSpinner,
  faDragon,
  faPause,
  faPlay,
  faBroom,
  faHeart,
  faLeaf,
  faHammer,
  faCog,
  faEgg,
  faBoltLightning,
  faFire,
  faMinus,
} from '@fortawesome/free-solid-svg-icons';

// This is important, we are going to let Nuxt worry about the CSS
config.autoAddCss = false;

// You can add your icons directly in this plugin. See other examples for how you
// can add other styles or just individual icons.
library.add(
  faRotate,
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faMars,
  faVenus,
  faSpinner,
  faDragon,
  faPause,
  faPlay,
  faBroom,
  faHeart,
  faLeaf,
  faHammer,
  faCog,
  faEgg,
  faBoltLightning,
  faFire,
  faMinus
);

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('font-awesome-icon', FontAwesomeIcon);
});
