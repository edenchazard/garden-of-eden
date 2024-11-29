import type { DragonAttributes, DragonData } from '~/types/DragonTypes';

export function phase(dragon: DragonData) {
  if (dragon.grow !== '0') {
    return 'Adult';
  } else if (dragon.grow === '0' && dragon.hatch !== '0') {
    return 'Hatchling';
  } else if (dragon.hatch === '0') {
    return 'Egg';
  }
}

export function attributes(dragon: DragonData): DragonAttributes {
  const hidden = dragon.start === '0';
  const dead = dragon.hoursleft === -2;
  const frozen =
    !hidden && dragon.hoursleft === -1 && phase(dragon) !== 'Adult';

  return {
    dead,
    hidden,
    frozen,
  };
}
