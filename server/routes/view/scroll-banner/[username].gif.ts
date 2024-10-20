import { loadImage, createCanvas } from 'canvas';
import type { Image } from 'canvas';
import { z } from 'zod';
import { createCanvas } from 'canvas';
import GIFEncoder from 'gifencoder';

async function getDragonStrip(dragonIds: string[]): Promise<{
  dragonStrip: Image;
  width: number;
  height: number;
}> {
  const dragonImages = await Promise.all(
    dragonIds.map((dragonId) =>
      loadImage(`https://dragcave.net/image/${dragonId}.gif`)
    )
  );

  const totalWidth = dragonImages.reduce(
    (acc, curr) => acc + curr.naturalWidth + 1,
    0
  );

  const maxHeight = Math.max(
    ...dragonImages.map((dragon) => dragon.naturalHeight)
  );

  const canvas = createCanvas(totalWidth, maxHeight);
  const ctx = canvas.getContext('2d');
  let totalXOffset = 0;
  dragonImages.forEach((dragonImage) => {
    ctx.drawImage(
      dragonImage,
      totalXOffset,
      maxHeight - dragonImage.naturalHeight,
      dragonImage.naturalWidth,
      dragonImage.naturalHeight
    );
    totalXOffset += dragonImage.naturalWidth + 1;
  });

  // trying to "flatten" the dragons into a single image to deliver
  const dragonStrip = await loadImage(canvas.toBuffer('image/png'));

  return {
    dragonStrip,
    width: totalWidth,
    height: maxHeight,
  };
}

async function getDragons(scrollName: string): Promise<string[]> {
  const dragons = await $fetch<
    DragCaveApiResponse<{ hasNextPage: boolean; endCursor: null | number }> & {
      dragons: Record<string, DragonData>;
    }
  >('https://dragcave.net/api/v2/user?username=' + scrollName, {
    headers: {
      Authorization: `Bearer ${process.env.DC_API_KEY}`,
    },
  });

  return Object.values(dragons).filter((dragon) => {
    return dragon.hoursleft > 0;
  });
}

export default defineEventHandler(async (event) => {
  const schema = z.object({
    username: z.string().min(4).max(30),
  });

  const params = await getValidatedRouterParams(event, schema.parse);

  const dragonIds = await getDragons(params.username);
  const { dragonStrip, width, height } = await getDragonStrip(dragonIds);

  const BANNERWIDTH = 150;
  const BANNERHEIGHT = 50;

  const encoder = new GIFEncoder(BANNERWIDTH, BANNERHEIGHT);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(100);
  encoder.setQuality(1);
  const canvas = createCanvas(BANNERWIDTH, BANNERHEIGHT);
  const ctx = canvas.getContext('2d');

  for (let i = 1; i <= width; i += 2) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, BANNERWIDTH, BANNERHEIGHT);
    if (i >= 1 && i <= BANNERWIDTH) {
      ctx.drawImage(dragonStrip, -i, BANNERHEIGHT - height, width, height);
      encoder.addFrame(ctx);
    } else {
      ctx.drawImage(dragonStrip, -i, BANNERHEIGHT - height, width, height);
      ctx.drawImage(
        dragonStrip,
        width - i,
        BANNERHEIGHT - height,
        width,
        height
      );
      encoder.addFrame(ctx);
    }
  }

  encoder.finish();

  setHeader(event, 'Content-Type', 'image/gif');
  return encoder.out.getData();
});
