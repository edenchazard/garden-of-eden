import { Jimp } from 'jimp';
import { Gif, GifFrame } from 'gifwrap';
import { expose } from 'threads/worker';
import { promises as fs } from 'fs';

async function exists(file: string) {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

// parentPort?.on('message', async function (message) {
//   if (message.type !== 'banner') {
//     return;
//   }

//   const { username, filePath, token } = message;

//   try {
//     await generateBannerToTemporary(username, filePath, token);
//     await moveBannerFromTemporary(filePath);
//     parentPort?.postMessage({ type: 'success', username });
//   } catch (e) {
//     parentPort?.postMessage({ type: 'error', username, error: e });
//   } finally {
//     parentPort?.postMessage({ type: 'jobFinished', username });
//   }
// });

const shareScrollWorker = {
  processBanner: async function (
    username: string,
    filePath: string,
    token: string
  ): Promise<{ type: string; username: string; error?: unknown }> {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ test');
    try {
      await generateBannerToTemporary(username, filePath, token);
      await moveBannerFromTemporary(filePath);
      return { type: 'success', username };
    } catch (error) {
      console.log(error);
      return { type: 'error', username, error };
    }
  },
};

export type ShareScrollWorker = typeof shareScrollWorker;

// Expose the function to the main thread
expose(shareScrollWorker);

async function moveBannerFromTemporary(filePath: string) {
  // remove old file, if it exists.
  if (await exists(filePath)) {
    await fs.unlink(filePath);
  }
  await fs.rename(`${filePath}.tmp`, filePath);
}

async function generateBannerToTemporary(
  scrollName: string,
  filePath: string,
  token: string
) {
  const dragonIds = await getDragonIds(scrollName, token);
  const { dragonStrip, width, height } = await getDragonStrip(dragonIds);

  const BANNERWIDTH = 150;
  const BANNERHEIGHT = 50;
  const frames: GifFrame[] = [];

  for (let i = 1; i <= width; i += 2) {
    // Buffer approach
    const frame = await Jimp.read(
      Buffer.alloc(BANNERWIDTH * BANNERHEIGHT * 4, 0xff)
    ); // RGBA white background
    frame.composite(dragonStrip, -i, BANNERHEIGHT - height);

    // Convert the Jimp frame to a GifFrame
    frames.push(
      new GifFrame(frame.bitmap.width, frame.bitmap.height, frame.bitmap.data, {
        delayCentisecs: 10,
      })
    );
  }

  // Create GIF and write to temporary file
  const gifBuffer = Buffer.alloc(0); // Create an empty buffer initially
  const gif = new Gif(frames, gifBuffer, { loops: 0 });
  // Write the generated GIF buffer to a file
  await fs.writeFile(`${filePath}.tmp`, new Uint8Array(gif.buffer));
}

async function getDragonStrip(dragonIds: string[]) {
  const dragonImages = await Promise.all(
    dragonIds.map((dragonId) =>
      Jimp.read(`https://dragcave.net/image/${dragonId}.gif`)
    )
  );

  const totalWidth = dragonImages.reduce(
    (acc, curr) => acc + curr.width + 1,
    0
  );
  const maxHeight = Math.max(...dragonImages.map((dragon) => dragon.height));

  const dragonStrip = await Jimp.read(Buffer.alloc(totalWidth, maxHeight));

  let totalXOffset = 0;
  dragonImages.forEach((dragonImage) => {
    dragonStrip.composite(
      dragonImage,
      totalXOffset,
      maxHeight - dragonImage.height
    );
    totalXOffset += dragonImage.width + 1;
  });

  return {
    dragonStrip,
    width: totalWidth,
    height: maxHeight,
  };
}

async function getDragonIds(username: string, token: string) {
  console.log('GetDragonIds');
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

  console.log(dragons);

  return Object.values(dragons)
    .filter((dragon) => dragon.hoursleft > 0)
    .map((dragon) => dragon.id);
}
