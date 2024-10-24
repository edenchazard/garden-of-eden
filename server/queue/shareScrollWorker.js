import { parentPort } from 'worker_threads';
import { loadImage, createCanvas } from 'canvas';
import GIFEncoder from 'gifencoder';
import { promises as fs, createWriteStream } from 'fs';

async function exists(file) {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

parentPort.on('message', async function (message) {
  if (message.type !== 'banner') {
    return;
  }

  const { username, filePath, token } = message;

  try {
    const banner = await generateBanner(username, token);
    await saveBanner(filePath, banner);
    parentPort.postMessage({ type: 'success', username });
  } catch (e) {
    parentPort.postMessage({ type: 'error', username });
  } finally {
    parentPort.postMessage({ type: 'jobFinished', username });
  }
});

/**
 * @param {string} filePath
 * @param {ArrayBuffer} buffer
 */
async function saveBanner(filePath, buffer) {
  // first, write to temporary file
  const stream = createWriteStream(`${filePath}.tmp`);

  stream.write(buffer, async () => {
    // remove old file, if it exists.
    if (await exists(filePath)) {
      await fs.unlink(filePath);
    }

    await fs.rename(`${filePath}.tmp`, filePath);
  });
}

/**
 *
 * @param {string} scrollname
 * @param {string} token
 * @returns
 */
async function generateBanner(scrollname, token) {
  const dragonIds = await getDragonIds(scrollname, token);
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

/**
 * @param {string[]} dragonIds 
 * @returns { Promise<{
  dragonStrip: Image;
  width: number;
  height: number;
}> }
 */
async function getDragonStrip(dragonIds) {
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

/**
 * @param {string} username
 * @param {string} token
 */
async function getDragonIds(username, token) {
  const response = await fetch(
    `https://dragcave.net/api/v2/user?username=${username}&filter=GROWING`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const { dragons } = await response.json();

  return Object.keys(dragons).filter((key) => {
    return dragons[key].hoursleft > 0;
  });
}
