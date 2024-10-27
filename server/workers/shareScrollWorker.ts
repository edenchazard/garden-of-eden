import sharp from 'sharp';
import GIF from 'sharp-gif2';
import { parentPort } from 'worker_threads';
import { promises as fs } from 'fs';
import 'ts-node/register';
import path from 'path';

async function exists(file: string) {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

parentPort?.on('message', async function (message) {
  if (message.type !== 'banner') return;
  const { username, filePath, token } = message;
  const startTime = Date.now();
  try {
    await generateBannerToTemporary(username, filePath, token);
    await moveBannerFromTemporary(filePath);
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000); // 60000 ms in a minute
    const seconds = ((duration % 60000) / 1000).toFixed(2); // Remaining ms converted to seconds
    console.log(`Duration: ${minutes} minutes and ${seconds} seconds`);
    parentPort?.postMessage({ type: 'success', username });
  } catch (e) {
    parentPort?.postMessage({ type: 'error', username, error: e });
  } finally {
    parentPort?.postMessage({ type: 'jobFinished', username });
  }
});

async function moveBannerFromTemporary(filePath: string) {
  if (await exists(filePath)) await fs.unlink(filePath);
  await fs.rename(`${filePath}.tmp`, filePath);
}
async function generateBannerToTemporary(
  scrollName: string,
  filePath: string,
  token: string
) {
  try {
    const dragonIds = await getDragonIds(scrollName, token);
    const { dragonStrip, width, height } = await getDragonStrip(dragonIds);

    const BANNERWIDTH = 150;
    const BANNERHEIGHT = 50;

    const frames: sharp.Sharp[] = [];
    const dragonStripBuffer = await dragonStrip.png().toBuffer();

    for (let i = 0; i <= width; i += 2) {
      const cropX = i % width;
      const cropWidth = Math.min(BANNERWIDTH, width - cropX);

      if (cropX >= width || cropWidth <= 0) {
        console.error(
          `Invalid crop area: cropX=${cropX}, cropWidth=${cropWidth}`
        );
        continue;
      }

      const visibleDragonStrip = sharp(dragonStripBuffer).extract({
        left: cropX,
        top: 0,
        width: cropWidth,
        height: Math.min(height, BANNERHEIGHT),
      });

      const frame = sharp({
        create: {
          width: BANNERWIDTH,
          height: BANNERHEIGHT,
          channels: 4,
          background: '#ffffff',
        },
      });

      const composites: sharp.OverlayOptions[] = [
        {
          input: await visibleDragonStrip.png().toBuffer(),
          top: BANNERHEIGHT - Math.min(height, BANNERHEIGHT),
          left: 0,
        },
      ];

      if (cropWidth < BANNERWIDTH) {
        const overflowWidth = BANNERWIDTH - cropWidth;
        const overflowStripWidth = Math.min(overflowWidth, width);

        const overflowDragonStrip = sharp(dragonStripBuffer).extract({
          left: 0,
          top: 0,
          width: overflowStripWidth,
          height: Math.min(height, BANNERHEIGHT),
        });

        composites.push({
          input: await overflowDragonStrip.png().toBuffer(),
          top: BANNERHEIGHT - Math.min(height, BANNERHEIGHT),
          left: cropWidth,
        });
      }

      const composedFrame = await frame.composite(composites).png().toBuffer();
      frames.push(sharp(composedFrame));
    }

    const outputDir = path.dirname(filePath);
    await fs.mkdir(outputDir, { recursive: true });

    const gif = await GIF.createGif({
      delay: 100,
      repeat: 0,
      transparent: true,
      format: 'rgb444',
    })
      .addFrame(frames)
      .toSharp();

    await gif.toFile(filePath + '.tmp');
  } catch (error) {
    console.error('Error in generateBannerToTemporary:', error);
  }
}

async function getDragonStrip(dragonIds: string[]) {
  const dragonImages = await Promise.all(
    dragonIds.map(async (dragonId) => {
      const response = await fetch(
        `https://dragcave.net/image/${dragonId}.gif`
      );
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return sharp(buffer);
    })
  );

  const dragonMetadatas = await Promise.all(
    dragonImages.map((dragonImage) => dragonImage.metadata())
  );

  const totalWidth = dragonMetadatas.reduce(
    (acc, curr) => acc + (curr.width ?? 0) + 1,
    0
  );
  const maxHeight = Math.max(
    ...dragonMetadatas.map((dragon) => dragon.height ?? 0)
  );

  let compositeImage = sharp({
    create: {
      width: totalWidth,
      height: maxHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  let totalXOffset = 0;
  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < dragonImages.length; i++) {
    const dragonImage = dragonImages[i];
    const dragonMetadata = dragonMetadatas[i];
    const xOffset = totalXOffset;
    const yOffset = maxHeight - (dragonMetadata.height ?? 0);

    composites.push({
      input: await dragonImage.toBuffer(),
      top: yOffset,
      left: xOffset,
    });

    totalXOffset += (dragonMetadata.width ?? 0) + 1;
  }

  compositeImage = compositeImage.composite(composites);

  return {
    dragonStrip: compositeImage,
    width: totalWidth,
    height: maxHeight,
  };
}

async function getDragonIds(username: string, token: string) {
  const response = await fetch(
    `https://dragcave.net/api/v2/user?username=${username}&filter=GROWING`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const { dragons } = (await response.json()) as {
    dragons: { id: string; hoursleft: number }[];
  };

  return Object.values(dragons)
    .filter((dragon) => dragon.hoursleft > 0)
    .map((dragon) => dragon.id);
}
