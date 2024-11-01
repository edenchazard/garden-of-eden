import sharp from 'sharp';
import GIF from 'sharp-gif2';
import { parentPort } from 'worker_threads';
import { promises as fs } from 'fs';
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
  try {
    await generateBannerToTemporary(username, filePath, token);
    await moveBannerFromTemporary(filePath);
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

// utils

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

async function textToPng(
  text: string,
  font: string, // eg. "16px Alkhemikal"
  styles: string // eg: "fill: white; ..."
): Promise<Buffer> {
  const { width, height } = await sharp(
    Buffer.from(
      `<svg>
        <text style="font: ${font};">${text}</text>
      </svg>`
    )
  )
    .png()
    .metadata();
  // make a dummy png with the text,
  // the text renders ABOVE the viewport which isn't what we want,
  // (and sharp doesn't support the dominant-baseline property!)
  // and there's no way for a svg to grab its own children's dimensions,
  // so the purpose of this dummy is to provide the raw dimensions of the text.

  const pngBuffer = await sharp(
    Buffer.from(
      `<svg width="${(width ?? 0) + 1}" height="${(height ?? 0) + 4}">
        <style>
          .text {
            font: ${font};
            filter: drop-shadow(1px 1px 0px rgba(0, 0, 0, 0.25));
            ${styles}
          }
        </style>
        <text y="${(height ?? 0) + 1}" class="text">${text}</text>
      </svg>`
    )
  )
    .png()
    .toBuffer();
  // the real deal is here. it uses the dummy-given dimensions
  // to push down the text into the viewport at an appropriate distance
  // and adds spacing to accomodate the text-shadow.

  return pngBuffer;
}

// the meat of it

async function generateBannerToTemporary(
  username: string,
  filePath: string,
  token: string
) {
  // missing things currently:
  // - complete the banner generation chain, one func at a time
  // - get access token from user so we can count a hidden scroll's dragons
  // - how to hit the hatchery's api for click info? flair info and images?
  try {
    const outputDir = path.dirname(filePath);
    await fs.mkdir(outputDir, { recursive: true });

    const { dragonCount, growingCount, growingIds } = await getScrollData(
      username,
      token
    );

    // const {
    //   stripBuffer, stripWidth, stripHeight
    // } = await getDragonStrip([]);

    const SAMPLE_FLAIR = 'saxifrage';
    const SAMPLE_WEEKLY_CLICKS = 12345;
    const SAMPLE_ALLTIME_CLICKS = 123456;
    const { bannerBuffer, bannerWidth, bannerHeight } = await getBannerBase(
      username,
      dragonCount,
      growingCount,
      SAMPLE_WEEKLY_CLICKS,
      SAMPLE_ALLTIME_CLICKS,
      SAMPLE_FLAIR
    );

    // const { dragonStrip, stripWidth, stripHeight } =
    //   await getDragonStrip(dragonIds);

    // const frames = await createFrames(dragonStrip, stripWidth, stripHeight);

    // const gif = await GIF.createGif({
    //   delay: FRAME_DELAY,
    //   repeat: 0,
    //   format: 'rgb444',
    // })
    //   .addFrame(frames)
    //   .toSharp();

    // await gif.toFile(`${filePath}.tmp`);

    const baseBanner = await sharp(bannerBuffer)
      .gif()
      .toFile(`${filePath}.tmp`);
  } catch (error) {
    console.error('Error in generateBannerToTemporary:', error);
    await fs.unlink(`${filePath}.tmp`).catch(() => {});
    throw error;
  }
}

async function getBannerBase(
  username: string,
  dragonCount: number,
  growingCount: number,
  weeklyClicks: number,
  allTimeClicks: number,
  flair: string | null
) {
  try {
    const startTime = performance.now();
    console.log('Generating banner stats...');
    const BANNER_WIDTH = 327;
    const BANNER_HEIGHT = 61;
    let compositeImage = createEmptyFrame(BANNER_WIDTH, BANNER_HEIGHT);
    const composites: sharp.OverlayOptions[] = [];

    // base
    composites.push({
      input: '/src/public/banner/base.webp',
      top: 0,
      left: 0,
    });

    // scrollname
    const usernamePng = await textToPng(
      username,
      '16px Alkhemikal',
      'fill: #dff6f5;'
    );
    const { height: usernameHeight, width: usernameWidth } =
      await sharp(usernamePng).metadata();
    composites.push({
      input: usernamePng,
      top: 9 + (16 - usernameHeight),
      left: 118,
    });

    // flair
    if (flair !== '') {
      const flairPath = `/src/public/items/${flair}.png`;
      const flairImage = sharp(flairPath)
        .greyscale()
        .threshold(255)
        .composite([
          {
            input: Buffer.from([255, 255, 255, Math.ceil(255 / 5)]),
            raw: {
              width: 1,
              height: 1,
              channels: 4,
            },
            tile: true,
            blend: 'dest-in',
          },
          { input: flairPath, left: -1, top: -1 },
        ])
        .png();
      const { height: flairHeight } = await flairImage.metadata();
      composites.push({
        input: await flairImage.toBuffer(),
        left: 118 + usernameWidth + 4,
        top: 16 - Math.floor((flairHeight ?? 0) / 2),
      });
    }

    const statText = (statName: string, statNumber: number) => `
      <tspan fill="#dff6f5">${statName}:</tspan> 
      <tspan fill="#f2bd59">${statNumber.toLocaleString()}</tspan>
    `;


    // stats
    const [
      compositeDragonCount,
      completeGrowingCount,
      compositeWeeklyClicks,
      compositeAllTimeClicks,
    ] = await Promise.all([
      textToPng(statText('Dragons', dragonCount), '8px Nokia Cellphone FC', ''),
      textToPng(
        statText('Growing', growingCount),
        '8px Nokia Cellphone FC',
        ''
      ),
      textToPng(
        statText('Weekly Clicks', weeklyClicks),
        '8px Nokia Cellphone FC',
        ''
      ),
      textToPng(
        statText('All-time Clicks', allTimeClicks),
        '8px Nokia Cellphone FC',
        ''
      ),
    ]);

    composites = [
      ...composites,
      {
        input: compositeDragonCount,
        left: 118,
        top: 28,
      },
      {
        input: completeGrowingCount,
        left: 118,
        top: 40,
      },
      {
        input: compositeWeeklyClicks,
        left: 200,
        top: 28,
      },
      {
        input: compositeAllTimeClicks,
        left: 200,
        top: 40,
      },
    ];

    console.log(
      `Banner stats generated in ${(performance.now() - startTime).toFixed(2)}ms`
    );
    const bannerBuffer = await compositeImage
      .composite(composites)
      .png()
      .toBuffer();
    return {
      bannerBuffer,
      bannerHeight: BANNER_HEIGHT,
      bannerWidth: BANNER_WIDTH,
    };
  } catch (error) {
    console.error('Error in getBannerBase:', error);
    throw error;
  }
}

//

async function getDragonStrip(dragonIds: string[]) {
  // it's fine for there to be no growing things,
  // it just means the carousel will be empty.
  if (dragonIds.length === 0) {
    return {
      stripBuffer: null,
      stripWidth: 0,
      stripHeight: 0,
    };
  }

  try {
    const startTime = performance.now();
    console.log('Generating growing images...');
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
        return Buffer.from((await response.arrayBuffer());
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

    const HEIGHT = 50;
    // height will be solid, no point in having it be flexible.
    // plus, dragons too tall will just be cropped

    let compositeImage = createEmptyFrame(totalWidth, HEIGHT);

    const composites: sharp.OverlayOptions[] = [];
    let xOffset = 0;

    for (let i = 0; i < dragonImages.length; i++) {
      const dragonImage = dragonImages[i];
      const metadata = dragonMetadatas[i];

      composites.push({
        input: await dragonImage.toBuffer(),
        top: HEIGHT - (metadata.height ?? 0),
        left: xOffset,
      });

      xOffset += (metadata.width ?? 0) + 1;
    }

    const stripBuffer = await compositeImage
      .composite(composites)
      .png()
      .toBuffer();

    console.log(
      `Growing images generated in ${(performance.now() - startTime).toFixed(0)}ms`
    );
    return {
      stripBuffer,
      stripWidth: totalWidth,
      stripHeight: HEIGHT,
    };
  } catch (error) {
    console.error('Error in getDragonStrip:', error);
    throw error;
  }
}

async function getScrollData(username: string, token: string) {
  try {
    type UserFetchJson = {
      errors: any[];
      dragons: { [key: string]: { hoursleft: number } };
      data: { hasNextPage: boolean; endCursor: string };
    };

    const startTime = performance.now();
    console.log('Fetching scroll data...');

    const DRAGONS = {
      dragonCount: 0,
      growingCount: 0,
      growingIds: [] as string[],
    };

    const FETCH_URL = `https://dragcave.net/api/v2/user?limit=1000&username=${encodeURIComponent(
      username
    )}`;
    const FETCH_OPT = { headers: { Authorization: `Bearer ${token}` } };
    const initialResponse = await fetch(FETCH_URL, FETCH_OPT);

    if (!initialResponse.ok) {
      throw new Error(
        `Failed to fetch dragon IDs: ${initialResponse.statusText}`
      );
    }

    const json = (await initialResponse.json()) as UserFetchJson;
    if (json.errors.length > 0) {
      console.error(json.errors);
      throw new Error(`Failed to fetch dragon IDs: DC responded with errors.`);
    }

    // first, get growing and ids
    DRAGONS.growingIds = Object.keys(json.dragons).filter((key) => {
      return json.dragons[key].hoursleft > 0;
    });
    DRAGONS.growingCount = DRAGONS.growingIds.length;

    // then, go through pages to gather total
    DRAGONS.dragonCount += Object.keys(json.dragons).length;
    let hasNextPage = json.data.hasNextPage;
    let endCursor = json.data.endCursor;
    while (hasNextPage) {
      await fetch(FETCH_URL + '&after=' + endCursor, FETCH_OPT)
        .then((pageResponse) => pageResponse.json())
        .then((pageJson) => {
          hasNextPage = (pageJson as UserFetchJson).data.hasNextPage;
          endCursor = (pageJson as UserFetchJson).data.endCursor ?? '';
          DRAGONS.dragonCount += Object.keys(
            (pageJson as UserFetchJson).dragons
          ).length;
        });
    }

    console.log(
      `Fetched scroll data in ${(performance.now() - startTime).toFixed(0)}ms`
    );

    return DRAGONS;
  } catch (error) {
    console.error('Error fetching dragon IDs:', error);
    throw error;
  }
}

/*
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
*/
