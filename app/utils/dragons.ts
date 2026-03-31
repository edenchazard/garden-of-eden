import type { DragonAttributes, DragonData } from '#shared/DragonTypes';

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
  const dead = dragon.hoursleft === -2;

  const hidden =
    dragon.start === '0' &&
    dragon.hatch === '0' &&
    dragon.grow === '0' &&
    dragon.hoursleft === -1;

  const frozen = dragon.grow === '0' && dragon.hoursleft === -1;

  return {
    dead,
    hidden,
    frozen,
  };
}
