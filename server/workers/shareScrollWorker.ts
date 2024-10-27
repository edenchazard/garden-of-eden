import sharp from 'sharp';
import GIF from 'sharp-gif2';
import { parentPort } from 'worker_threads';
import { promises as fs } from 'fs';
import 'ts-node/register';
import path from 'path';

const BANNER_WIDTH = 150;
const BANNER_HEIGHT = 50;
const FRAME_DELAY = 100;
const SCROLL_STEP = 2;

async function fileExists(filePath: string) {
  try {
    await fs.stat(filePath);
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
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(2);
    console.log(`Duration: ${minutes} minutes and ${seconds} seconds`);

    parentPort?.postMessage({ type: 'success', username });
  } catch (e) {
    parentPort?.postMessage({ type: 'error', username, error: e });
  } finally {
    parentPort?.postMessage({ type: 'jobFinished', username });
  }
});

async function moveBannerFromTemporary(filePath: string) {
  try {
    if (await fileExists(filePath)) {
      await fs.unlink(filePath);
    }
    await fs.rename(`${filePath}.tmp`, filePath);
  } catch (error) {
    console.error('Error moving banner from temporary:', error);
    throw error;
  }
}

async function generateBannerToTemporary(
  username: string,
  filePath: string,
  token: string
) {
  try {
    const dragonIds = await getDragonIds(username, token);

    if (dragonIds.length === 0) {
      console.warn(`No dragons found for user ${username}.`);
      return;
    }

    const { dragonStrip, stripWidth, stripHeight } =
      await getDragonStrip(dragonIds);

    const frames = await createFrames(dragonStrip, stripWidth, stripHeight);

    const outputDir = path.dirname(filePath);
    await fs.mkdir(outputDir, { recursive: true });

    const gif = await GIF.createGif({
      delay: FRAME_DELAY,
      repeat: 0,
      format: 'rgb444',
    })
      .addFrame(frames)
      .toSharp();

    await gif.toFile(`${filePath}.tmp`);
  } catch (error) {
    console.error('Error in generateBannerToTemporary:', error);
    await fs.unlink(`${filePath}.tmp`).catch(() => {});
    throw error;
  }
}

async function createFrames(
  dragonStrip: sharp.Sharp,
  stripWidth: number,
  stripHeight: number
): Promise<sharp.Sharp[]> {
  const dragonStripBuffer = await dragonStrip.png().toBuffer();

  const framePromises = [];
  for (
    let scrollPosition = 0;
    scrollPosition < stripWidth;
    scrollPosition += SCROLL_STEP
  ) {
    framePromises.push(
      createFrame(scrollPosition, dragonStripBuffer, stripWidth, stripHeight)
    );
  }

  return Promise.all(framePromises);
}

async function createFrame(
  scrollPosition: number,
  dragonStripBuffer: Buffer,
  stripWidth: number,
  stripHeight: number
): Promise<sharp.Sharp> {
  const cropX = scrollPosition % stripWidth;
  const visibleWidth = Math.min(BANNER_WIDTH, stripWidth - cropX);

  const visibleDragonStrip = sharp(dragonStripBuffer).extract({
    left: cropX,
    top: 0,
    width: visibleWidth,
    height: Math.min(stripHeight, BANNER_HEIGHT),
  });

  const frame = createEmptyFrame(BANNER_WIDTH, BANNER_HEIGHT);

  const composites: sharp.OverlayOptions[] = [
    {
      input: await visibleDragonStrip.toBuffer(),
      top: BANNER_HEIGHT - Math.min(stripHeight, BANNER_HEIGHT),
      left: 0,
    },
  ];

  if (visibleWidth < BANNER_WIDTH) {
    const overflowWidth = BANNER_WIDTH - visibleWidth;
    const overflowStripWidth = Math.min(overflowWidth, stripWidth);

    const overflowDragonStrip = sharp(dragonStripBuffer).extract({
      left: 0,
      top: 0,
      width: overflowStripWidth,
      height: Math.min(stripHeight, BANNER_HEIGHT),
    });

    composites.push({
      input: await overflowDragonStrip.toBuffer(),
      top: BANNER_HEIGHT - Math.min(stripHeight, BANNER_HEIGHT),
      left: visibleWidth,
    });
  }

  const composedFrameBuffer = await frame
    .composite(composites)
    .png()
    .toBuffer();
  return sharp(composedFrameBuffer);
}

function createEmptyFrame(width: number, height: number): sharp.Sharp {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });
}

async function getDragonStrip(dragonIds: string[]) {
  try {
    const dragonBuffers = await Promise.all(
      dragonIds.map(async (dragonId) => {
        const response = await fetch(
          `https://dragcave.net/image/${dragonId}.gif`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch dragon image ${dragonId}: ${response.statusText}`
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      })
    );

    const dragonImages = dragonBuffers.map((buffer) => sharp(buffer));

    const dragonMetadatas = await Promise.all(
      dragonImages.map((img) => img.metadata())
    );

    const totalWidth = dragonMetadatas.reduce(
      (acc, curr) => acc + (curr.width ?? 0) + 1,
      0
    );
    const maxHeight = Math.max(
      ...dragonMetadatas.map((meta) => meta.height ?? 0)
    );

    let compositeImage = createEmptyFrame(totalWidth, maxHeight);

    const composites: sharp.OverlayOptions[] = [];
    let xOffset = 0;

    for (let i = 0; i < dragonImages.length; i++) {
      const dragonImage = dragonImages[i];
      const metadata = dragonMetadatas[i];

      composites.push({
        input: await dragonImage.toBuffer(),
        top: maxHeight - (metadata.height ?? 0),
        left: xOffset,
      });

      xOffset += (metadata.width ?? 0) + 1;
    }

    compositeImage = compositeImage.composite(composites);

    return {
      dragonStrip: compositeImage,
      stripWidth: totalWidth,
      stripHeight: maxHeight,
    };
  } catch (error) {
    console.error('Error in getDragonStrip:', error);
    throw error;
  }
}

async function getDragonIds(
  username: string,
  token: string
): Promise<string[]> {
  try {
    const response = await fetch(
      `https://dragcave.net/api/v2/user?username=${encodeURIComponent(username)}&filter=GROWING`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch dragon IDs: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      dragons: { id: string; hoursleft: number }[];
    };

    return Object.values(data.dragons)
      .filter((dragon) => dragon.hoursleft > 0)
      .map((dragon) => dragon.id);
  } catch (error) {
    console.error('Error fetching dragon IDs:', error);
    throw error;
  }
}
