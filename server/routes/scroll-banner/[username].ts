import { loadImage, createCanvas } from 'canvas';
import type { Image } from 'canvas';
import { z } from 'zod';
import GIFEncoder from 'gifencoder';
import { promises as fs, createWriteStream, createReadStream } from 'fs';

const queue = new Set<string>();

async function saveBanner(filePath: string, buffer: ArrayBuffer) {
  await Promise.all([
    fs.mkdir('/tmp/caches/banners', { recursive: true }),
    fs.mkdir('/caches/banners', { recursive: true }),
  ]);

  // first, write to temporary
  const stream = createWriteStream(`/tmp${filePath}`);
  stream.write(buffer);

  stream.close();

  // then, move to actual location
  await fs.rename(`/tmp${filePath}`, filePath);
  queue.delete(filePath);
}

async function generateBanner(scrollname: string) {
  const dragonIds = await getDragons(scrollname);
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
  return encoder.out.getData();
}

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
  // todo: if the length of the strip is actually less than the carousel window,
  // there won't be a carousel. the eggs will just sit at the center of the window,
  // and the gif will have just one frame.

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
  const { dragons } = await $fetch<
    DragCaveApiResponse<{ hasNextPage: boolean; endCursor: null | number }> & {
      dragons: Record<string, DragonData>;
    }
  >('https://dragcave.net/api/v2/user?username=' + scrollName.split('.')[0], {
    headers: {
      Authorization: `Bearer ${process.env.CLIENT_SECRET}`,
    },
  });

  return Object.keys(dragons).filter((key) => {
    return dragons[key].hoursleft > 0;
  });
}

async function exists(file: string) {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  const schema = z.object({
    username: z
      .string()
      .min(4)
      .max(36)
      .transform((v) => v.substring(0, v.indexOf('.'))),
  });

  const params = await getValidatedRouterParams(event, schema.parse);
  const filePath = `/caches/banners/${params.username}.gif`;
  const cacheLength = 1000 * 60 * 60;
  let regenerate = true;

  try {
    if (await exists(filePath)) {
      console.log('Banner exists');
      const { mtime } = await fs.stat(filePath);

      if (mtime.getTime() > Date.now() - cacheLength) {
        regenerate = false;
      }

      setHeaders(event, {
        'Content-Type': 'image/gif',
        'Cache-Control': `public, max-age=${cacheLength / 1000}`,
      });

      return sendStream(event, createReadStream(filePath, { autoClose: true }));
    } else {
      setResponseStatus(event, 404);
    }
  } catch (e) {
    console.error(e);
  } finally {
    if (regenerate && !queue.has(filePath)) {
      console.log('Processing banner for', params.username, queue);

      queue.add(filePath);
      saveBanner(filePath, await generateBanner(params.username));
    }
  }
  setResponseStatus(event, 404);
});
