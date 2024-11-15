import sharp from 'sharp';
import GIF from 'sharp-gif2';
import { promises as fs } from 'fs';
import path from 'path';
import { ofetch, FetchError } from 'ofetch';
export default async function bannerGen(job) {
    console.info('Bannergen started for user: ', job.data);
    const perfData = await generateBannerToTemporary(job.data);
    if (perfData.error === 'API Timeout')
        throw new Error(perfData.error);
    else
        console.error(perfData.error);
    return {
        type: "jobFinished" /* WorkerResponseType.jobFinished */,
        user: job.data.user,
        performanceData: perfData,
    };
}
const baseBannerWidth = 327;
const baseBannerHeight = 61;
const baseCarouselWidth = 106;
async function generateBannerToTemporary(input) {
    const perfData = {
        dragonsIncluded: null,
        dragonsOmitted: null,
        statGenTime: null,
        dragonFetchTime: null,
        dragonGenTime: null,
        frameGenTime: null,
        gifGenTime: null,
        totalTime: null,
        error: null,
    };
    let startTime = performance.now();
    const start = () => {
        return (startTime = performance.now());
    };
    const end = () => {
        return performance.now() - startTime;
    };
    try {
        const outputDir = path.dirname(input.filePath);
        await fs.mkdir(outputDir, { recursive: true });
        const totalStartTime = startTime;
        start();
        const bannerBuffer = await getBannerBase(input);
        perfData.statGenTime = end();
        if (input.dragons.length > 0) {
            start();
            const { dragonsIncluded, dragonsOmitted, dragonBuffers } = await getDragonBuffers(input.dragons, input.clientSecret);
            perfData.dragonFetchTime = end();
            perfData.dragonsIncluded = dragonsIncluded;
            perfData.dragonsOmitted = dragonsOmitted;
            start();
            const { stripBuffer, stripWidth, stripHeight } = await getDragonStrip(dragonBuffers);
            perfData.dragonGenTime = end();
            start();
            const frames = await createFrames(bannerBuffer, stripBuffer, stripWidth, stripHeight);
            perfData.frameGenTime = end();
            start();
            const gif = await GIF.createGif({
                delay: 100,
                repeat: 0,
                format: 'rgb444',
            })
                .addFrame(frames)
                .toSharp();
            await gif.toFile(`${input.filePath}.tmp`);
            perfData.gifGenTime = end();
        }
        else {
            perfData.dragonsIncluded = [];
            perfData.dragonsOmitted = [];
            perfData.dragonFetchTime = 0;
            perfData.dragonGenTime = 0;
            perfData.frameGenTime = 0;
            start();
            await sharp(bannerBuffer).gif().toFile(`${input.filePath}.tmp`);
            perfData.gifGenTime = end();
        }
        perfData.totalTime = performance.now() - totalStartTime;
        await moveBannerFromTemporary(input.filePath);
    }
    catch (error) {
        perfData.error = error === 23 ? 'API Timeout' : error;
        await fs.unlink(`${input.filePath}.tmp`).catch(() => { });
    }
    return perfData;
}
// bannergen steps
async function getBannerBase(input) {
    try {
        const compositeImage = createEmptyFrame(baseBannerWidth, baseBannerHeight);
        const composites = [];
        // base
        composites.push({
            input: path.resolve('/src/resources/', 'banner/base.webp'),
            top: 0,
            left: 0,
        });
        // scrollname
        const usernamePng = await textToPng(input.user.username, '16px Alkhemikal', 'fill: #dff6f5;');
        const { height: usernameHeight, width: usernameWidth } = await sharp(usernamePng).metadata();
        composites.push({
            input: usernamePng,
            top: 25 - (usernameHeight ?? 0),
            left: 118,
        });
        // flair
        if (input.user.flairPath) {
            const flairPath = path.resolve('/src/resources/public/', input.user.flairPath);
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
                // todo: drop this
            ])
                .png();
            const { height: flairHeight } = await flairImage.metadata();
            composites.push({
                input: await flairImage.toBuffer(),
                left: 122 + (usernameWidth ?? 0),
                top: 17 - Math.floor((flairHeight ?? 0) / 2),
            });
        }
        const statText = (statName, statNumber) => textToPng(`
        <tspan fill="#dff6f5">${statName}:</tspan> 
        <tspan fill="#f2bd59">${Intl.NumberFormat().format(statNumber)}</tspan>
      `, '8px Nokia Cellphone FC', '');
        const rankText = (rankNumber) => textToPng(`
        <tspan fill="#dff6f5">Ranked</tspan> 
        <tspan fill="#f2bd59">#${rankNumber}</tspan>
      `, '8px Nokia Cellphone FC', '');
        // stats
        const [compositeWeeklyClicks, compositeWeeklyRank, compositeAllTimeClicks, compositeAllTimeRank,] = await Promise.all([
            statText('Weekly Clicks', input.weeklyClicks),
            input.weeklyRank ? rankText(input.weeklyRank) : null,
            statText('All-time Clicks', input.allTimeClicks),
            input.allTimeRank ? rankText(input.allTimeRank) : null,
        ]);
        composites.push({
            input: compositeWeeklyClicks,
            left: 118,
            top: 28,
        }, {
            input: compositeAllTimeClicks,
            left: 118,
            top: 40,
        });
        if (compositeWeeklyRank) {
            composites.push({
                input: compositeWeeklyRank,
                left: 245,
                top: 29,
            });
        }
        if (compositeAllTimeRank) {
            composites.push({
                input: compositeAllTimeRank,
                left: 245,
                top: 41,
            });
        }
        return await compositeImage.composite(composites).png().toBuffer();
    }
    catch (error) {
        console.error('Error in getBannerBase:', error);
        throw error;
    }
}
async function getDragonBuffers(dragonIds, clientSecret) {
    try {
        const timeout = 10000;
        // change to 1 to force timeout
        const dragonsIncluded = [];
        const dragonsOmitted = [];
        const { errors, dragons, } = await ofetch(`https://dragcave.net/api/v2/dragons?ids=${dragonIds.join(',')}`, {
            headers: { Authorization: `Bearer ${clientSecret}` },
            retry: 3,
            retryDelay: 1000,
            timeout,
        });
        if (errors.length > 0) {
            throw new Error('Errors getting bulk dragons: ' + errors);
        }
        else {
            Object.keys(dragons).forEach((key) => {
                if ('hoursleft' in dragons[key] && dragons[key].hoursleft > 0) {
                    dragonsIncluded.push(key);
                }
                else {
                    dragonsOmitted.push(key);
                }
            });
        }
        const dragonBuffers = await Promise.all(dragonsIncluded.map(async (dragonId) => {
            const dragonBuffer = await ofetch(`https://dragcave.net/image/${dragonId}.gif`, {
                retry: 3,
                retryDelay: 1000,
                timeout,
                responseType: 'arrayBuffer',
            });
            return Buffer.from(dragonBuffer);
        }));
        return {
            dragonsIncluded,
            dragonsOmitted,
            dragonBuffers,
        };
    }
    catch (error) {
        if (error instanceof FetchError) {
            const code = error.cause?.code ?? 0;
            if (code === 23)
                throw 23;
        }
        throw error;
    }
}
async function getDragonStrip(dragonBuffers) {
    const dragonMetadatas = await Promise.all(dragonBuffers.map((buf) => {
        const img = sharp(buf);
        return img.metadata();
    }));
    const spacing = 2;
    // how much room between each thing
    const stripHeight = 49;
    // height will be solid, no point in having it be flexible.
    // plus, dragons too tall will just be cropped
    const totalWidth = dragonMetadatas.reduce((acc, curr) => acc + (curr.width ?? 0) + spacing, 0);
    const compositeImage = createEmptyFrame(totalWidth, stripHeight);
    const composites = [];
    const xOffsets = [0];
    dragonMetadatas.forEach((metadata) => {
        const prevOffset = xOffsets[xOffsets.length - 1];
        xOffsets.push(prevOffset + (metadata.width ?? 0) + spacing);
    });
    await Promise.all(dragonBuffers.map(async (dragonBuffer, index) => {
        composites.push({
            input: dragonBuffer,
            top: stripHeight - (dragonMetadatas[index].height ?? 0),
            left: xOffsets[index],
        });
    }));
    const stripBuffer = await compositeImage
        .composite(composites)
        .png()
        .toBuffer();
    return {
        stripBuffer,
        stripWidth: totalWidth,
        stripHeight,
    };
}
async function createFrames(bannerBuffer, stripBuffer, stripWidth, stripHeight) {
    const framePromises = [];
    if (stripWidth < baseCarouselWidth) {
        const frame = createEmptyFrame(baseBannerWidth, baseBannerHeight);
        const composites = [
            {
                input: bannerBuffer,
                top: 0,
                left: 0,
            },
            {
                input: stripBuffer,
                top: 5,
                left: Math.floor(baseCarouselWidth / 2) - Math.floor(stripWidth / 2) + 5,
            },
        ];
        const composedFrameBuffer = await frame
            .composite(composites)
            .png()
            .toBuffer();
        framePromises.push(sharp(composedFrameBuffer));
    }
    else {
        for (let scrollPosition = 0; scrollPosition < stripWidth; scrollPosition += 2) {
            framePromises.push(createFrame(scrollPosition, bannerBuffer, stripBuffer, stripWidth, stripHeight));
        }
    }
    return Promise.all(framePromises);
}
// utils
async function textToPng(text, font, // eg. "16px Alkhemikal"
styles // eg: "fill: white; ..."
) {
    const { width, height } = await sharp(Buffer.from(`<svg>
        <text style="font: ${font};">${text}</text>
      </svg>`))
        .png()
        .metadata();
    // make a dummy png with the text,
    // the text renders ABOVE the viewport which isn't what we want,
    // (and sharp doesn't support the dominant-baseline property!)
    // and there's no way for a svg to grab its own children's dimensions,
    // so the purpose of this dummy is to provide the raw dimensions of the text.
    const pngBuffer = await sharp(Buffer.from(`<svg width="${(width ?? 0) + 1}" height="${(height ?? 0) + 4}">
        <style>
          .text {
            font: ${font};
            filter: drop-shadow(1px 1px 0px rgba(0, 0, 0, 0.25));
            ${styles}
          }
        </style>
        <text y="${(height ?? 0) + 1}" class="text">${text}</text>
      </svg>`))
        .png()
        .toBuffer();
    // the real deal is here. it uses the dummy-given dimensions
    // to push down the text into the viewport at an appropriate distance
    // and adds spacing to accomodate the text-shadow.
    return pngBuffer;
}
function createEmptyFrame(width, height) {
    return sharp({
        create: {
            width,
            height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    });
}
async function createFrame(scrollPosition, bannerBuffer, dragonStripBuffer, stripWidth, stripHeight) {
    const cropX = scrollPosition % stripWidth;
    const visibleWidth = Math.min(baseCarouselWidth, stripWidth - cropX);
    const visibleDragonStrip = sharp(dragonStripBuffer).extract({
        left: cropX,
        top: 0,
        width: visibleWidth,
        height: stripHeight,
    });
    const frame = createEmptyFrame(baseBannerWidth, baseBannerHeight);
    const composites = [
        {
            input: bannerBuffer,
            top: 0,
            left: 0,
        },
        {
            input: await visibleDragonStrip.toBuffer(),
            top: 5,
            left: 5,
        },
    ];
    if (visibleWidth < baseCarouselWidth) {
        const overflowWidth = baseCarouselWidth - visibleWidth;
        const overflowStripWidth = Math.min(overflowWidth, stripWidth);
        const overflowDragonStrip = sharp(dragonStripBuffer).extract({
            left: 0,
            top: 0,
            width: overflowStripWidth,
            height: stripHeight,
        });
        composites.push({
            input: await overflowDragonStrip.toBuffer(),
            top: 5,
            left: visibleWidth + 5,
        });
    }
    return sharp(await frame.composite(composites).png().toBuffer());
}
async function moveBannerFromTemporary(filePath) {
    try {
        if (await fileExists(filePath)) {
            await fs.unlink(filePath);
        }
        await fs.rename(`${filePath}.tmp`, filePath);
    }
    catch (error) {
        console.error('Error moving banner from temporary:', error);
        throw error;
    }
}
async function fileExists(filePath) {
    try {
        await fs.stat(filePath);
        return true;
    }
    catch {
        return false;
    }
}
