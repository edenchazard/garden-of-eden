import sharp from 'sharp';
import GIF from 'sharp-gif2';
import { promises as fs } from 'fs';
import path from 'path';
import { ofetch, FetchError } from 'ofetch';
export default async function bannerGen(job) {
    const handler = await (async () => {
        switch (job.data.stats) {
            case 'dragons':
                job.data.data = await getScrollStats(job.data);
                return getBannerBaseForDragons;
            case 'garden':
                return getBannerBaseForGarden;
            default:
                throw new Error('Invalid handler');
        }
    })();
    const perfData = await generateBannerToTemporary(job.data, (base) => handler(base, job.data));
    if (perfData.error)
        console.error(perfData.error);
    if (perfData.error === 'API Timeout')
        throw new Error(perfData.error);
    return {
        performanceData: perfData,
    };
}
const baseBannerWidth = 327;
const baseBannerHeight = 61;
const baseCarouselWidth = 106;
async function generateBannerToTemporary(input, baser) {
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
    const start = () => (startTime = performance.now());
    const end = () => performance.now() - startTime;
    try {
        const outputDir = path.dirname(input.filePath);
        await fs.mkdir(outputDir, { recursive: true });
        const totalStartTime = startTime;
        start();
        const base = await getBannerBaseComposite(input);
        const bannerBuffer = await createEmptyFrame(baseBannerWidth, baseBannerHeight)
            .composite(await baser(base))
            .png()
            .toBuffer();
        perfData.statGenTime = end();
        if (input.dragons.length > 0) {
            start();
            const { dragonsIncluded, dragonsOmitted, dragonBuffers } = await getDragonBuffers(input.dragons, input.secret);
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
async function getBannerBaseComposite(input) {
    const composites = [
        {
            input: path.resolve('/src/resources/public/share/scroll/', input.requestParameters.style + '.webp'),
            top: 0,
            left: 0,
        },
    ];
    // scrollname
    const usernamePng = await textToPng(input.user.username, '16px Alkhemikal', `fill: ${input.requestParameters.usernameColour};`);
    const { height: usernameHeight, width: usernameWidth } = await sharp(usernamePng).metadata();
    composites.push({
        input: usernamePng,
        top: 25 - (usernameHeight ?? 0),
        left: 118,
    });
    // flair
    // console.log('CHOSEN FLAIR: ', input.user.flairPath); // flair debugging
    if (input.user.flairPath) {
        const shadowPath = path.resolve('/src/resources/', input.user.flairPath.replace('items', 'flair-shadows'));
        if (await fileExists(shadowPath)) {
            const { height } = await sharp(shadowPath).png().metadata();
            composites.push({
                input: await sharp(shadowPath).toBuffer(),
                left: 121 + (usernameWidth ?? 0),
                top: 16 - Math.floor((height ?? 0) / 2),
            });
        }
        else {
            const flairPath = path.resolve('/src/resources/public/', input.user.flairPath);
            const flairShadow = sharp(flairPath)
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
            ])
                .extend({
                top: 1,
                left: 1,
                extendWith: 'background',
                background: 'transparent',
            })
                .png();
            const [{ height: flairHeight }, flairShadowBuffer] = await Promise.all([
                sharp(flairPath).png().metadata(),
                flairShadow.toBuffer(),
            ]);
            const flairImage = await sharp(flairShadowBuffer)
                .composite([{ input: flairPath, left: 0, top: 0 }])
                .png();
            await flairImage.toFile(shadowPath);
            composites.push({
                input: await flairImage.toBuffer(),
                left: 121 + (usernameWidth ?? 0),
                top: 16 - Math.floor((flairHeight ?? 0) / 2),
            });
        }
    }
    return composites;
}
async function getBannerBaseForGarden(base, input) {
    const rankText = (rankNumber) => textToPng(`
        <tspan fill="${input.requestParameters.labelColour}">Ranked</tspan> 
        <tspan fill="${input.requestParameters.valueColour}">#${rankNumber}</tspan>
      `, '8px Nokia Cellphone FC', '');
    // stats
    const [weeklyClicks, weeklyRank, allTimeClicks, allTimeRank] = await Promise.all([
        makeStatText(input, 'Weekly Clicks', input.data.weeklyClicks),
        input.data.weeklyRank ? rankText(input.data.weeklyRank) : null,
        makeStatText(input, 'All-time Clicks', input.data.allTimeClicks),
        input.data.allTimeRank ? rankText(input.data.allTimeRank) : null,
    ]);
    base.push({
        input: weeklyClicks,
        left: 118,
        top: 28,
    }, {
        input: allTimeClicks,
        left: 118,
        top: 40,
    });
    if (weeklyRank) {
        base.push({
            input: weeklyRank,
            left: 245,
            top: 29,
        });
    }
    if (allTimeRank) {
        base.push({
            input: allTimeRank,
            left: 245,
            top: 41,
        });
    }
    return base;
}
async function getBannerBaseForDragons(base, input) {
    // stats
    const [total, frozen, eggs, hatchlings, adults] = await Promise.all([
        makeStatText(input, 'Total', input.data.total),
        makeStatText(input, 'Frozen', input.data.frozen),
        makeStatText(input, 'Eggs', input.data.eggs),
        makeStatText(input, 'Hatch', input.data.hatch),
        makeStatText(input, 'Adults', input.data.adult),
    ]);
    base.push({
        input: total,
        left: 118,
        top: 28,
    }, {
        input: frozen,
        left: 118,
        top: 40,
    }, {
        input: eggs,
        left: 190,
        top: 28,
    }, {
        input: hatchlings,
        left: 190,
        top: 40,
    }, {
        input: adults,
        left: 240,
        top: 28,
    });
    return base;
}
async function getDragonBuffers(dragonIds, secret) {
    try {
        const timeout = 10000;
        // change to 1 to force timeout
        const dragonsIncluded = [];
        const dragonsOmitted = [];
        const { errors, dragons } = await ofetch('https://dragcave.net/api/v2/dragons', {
            headers: { Authorization: `Bearer ${secret}` },
            query: {
                ids: dragonIds.join(','),
            },
            retry: 3,
            retryDelay: 1000,
            timeout,
        });
        if (errors.length > 0) {
            throw new Error('Errors getting bulk dragons: ' + errors);
        }
        Object.keys(dragons).forEach((key) => {
            const arr = 'hoursleft' in dragons[key] && dragons[key].hoursleft > 0
                ? dragonsIncluded
                : dragonsOmitted;
            arr.push(key);
        });
        const dragonBuffers = await Promise.all(dragonsIncluded.map(async (dragonId) => Buffer.from(await ofetch(`https://dragcave.net/image/${dragonId}.gif`, {
            retry: 3,
            retryDelay: 1000,
            timeout,
            responseType: 'arrayBuffer',
        }))));
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
    const dragonMetadatas = await Promise.all(dragonBuffers.map((buf) => sharp(buf).metadata()));
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
    dragonBuffers.forEach((dragonBuffer, index) => {
        composites.push({
            input: dragonBuffer,
            top: stripHeight - (dragonMetadatas[index].height ?? 0),
            left: xOffsets[index],
        });
    });
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
        const composedFrameBuffer = await createEmptyFrame(baseBannerWidth, baseBannerHeight)
            .composite([
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
        ])
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
async function getScrollStats(input) {
    const { errors, dragons } = await ofetch('https://dragcave.net/api/v2/user', {
        headers: { Authorization: `Bearer ${input.secret}` },
        query: {
            username: input.user.username,
            limit: 99999,
            filter: 'ALL',
        },
        retry: 3,
        retryDelay: 1000,
    });
    const stats = {
        female: 0,
        male: 0,
        eggs: 0,
        hatch: 0,
        adult: 0,
        frozen: 0,
        total: Object.keys(dragons).length,
    };
    for (const code in dragons) {
        const dragon = dragons[code];
        if (dragon.gender === 'Female') {
            stats.female++;
        }
        else if (dragon.gender === 'Male') {
            stats.male++;
        }
        if (dragon.grow !== '0') {
            stats.adult++;
        }
        else if (dragon.hoursleft > -1) {
            if (dragon.hatch !== '0') {
                stats.hatch++;
            }
            else {
                stats.eggs++;
            }
        }
        if (dragon.hoursleft === -1 && dragon.grow === '0') {
            stats.frozen++;
        }
    }
    if (errors.length > 0) {
        throw new Error('Errors getting stats: ' + errors);
    }
    return stats;
}
// utils
function makeStatText(input, statName, statNumber) {
    return textToPng(`
      <tspan fill="${input.requestParameters.labelColour}">${statName}:</tspan> 
      <tspan fill="${input.requestParameters.valueColour}">${Intl.NumberFormat().format(statNumber)}</tspan>
    `, '8px Nokia Cellphone FC', '');
}
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
    return sharp(Buffer.from(`<svg width="${(width ?? 0) + 1}" height="${(height ?? 0) + 4}">
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
    if (await fileExists(filePath)) {
        await fs.unlink(filePath);
    }
    await fs.rename(`${filePath}.tmp`, filePath);
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
