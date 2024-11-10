import sharp from 'sharp';
import GIF from 'sharp-gif2';
import { parentPort } from 'worker_threads';
import { promises as fs } from 'fs';
import path from 'path';
import { ofetch } from 'ofetch';
const baseBannerWidth = 327;
const baseBannerHeight = 61;
const baseCarouselWidth = 106;
async function fileExists(filePath) {
    try {
        await fs.stat(filePath);
        return true;
    }
    catch {
        return false;
    }
}
parentPort?.on('message', async function (message) {
    if (message.type !== 'banner')
        return;
    const { user, filePath, weeklyClicks, weeklyRank, allTimeClicks, allTimeRank, dragons, clientSecret, } = message;
    try {
        await generateBannerToTemporary(user, filePath, weeklyClicks, weeklyRank, allTimeClicks, allTimeRank, dragons, clientSecret);
        await moveBannerFromTemporary(filePath);
        parentPort?.postMessage({ type: 'success', user });
    }
    catch (e) {
        console.log(e);
        parentPort?.postMessage({ type: 'error', user, filePath, error: e });
    }
    finally {
        parentPort?.postMessage({ type: 'jobFinished', user });
    }
});
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
// utils
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
// the meat of it
async function generateBannerToTemporary(user, filePath, weeklyClicks, weeklyRank, allTimeClicks, allTimeRank, dragons, clientSecret) {
    try {
        const outputDir = path.dirname(filePath);
        await fs.mkdir(outputDir, { recursive: true });
        const totalStartTime = performance.now();
        let startTime = totalStartTime;
        console.log('Generating banner stats...');
        const bannerBuffer = await getBannerBase(user.username, weeklyClicks, weeklyRank, allTimeClicks, allTimeRank, user.flairUrl);
        console.log(`Banner stats generated in ${performance.now() - startTime}ms`);
        if (dragons.length > 0) {
            startTime = performance.now();
            console.log('Generating dragon strip...');
            const { stripBuffer, stripWidth, stripHeight } = await getDragonStrip(dragons, clientSecret);
            console.log(`Dragon strip generated in ${performance.now() - startTime}ms`);
            console.log('Generating frames...');
            startTime = performance.now();
            const frames = await createFrames(bannerBuffer, stripBuffer, stripWidth, stripHeight);
            console.log(`Frames generated in ${performance.now() - startTime}ms`);
            console.log('Creating and saving the GIF...');
            startTime = performance.now();
            const gif = await GIF.createGif({
                delay: 100,
                repeat: 0,
                format: 'rgb444',
            })
                .addFrame(frames)
                .toSharp();
            await gif.toFile(`${filePath}.tmp`);
            console.log(`GIF saved in ${performance.now() - startTime}`);
        }
        else {
            console.log('Creating and saving the GIF...');
            startTime = performance.now();
            await sharp(bannerBuffer).gif().toFile(`${filePath}.tmp`);
            console.log(`GIF saved in ${performance.now() - startTime}`);
        }
        console.log(`Total generation time ${performance.now() - totalStartTime}ms`);
    }
    catch (error) {
        console.error('Error in generateBannerToTemporary:', error);
        await fs.unlink(`${filePath}.tmp`).catch(() => { });
        throw error;
    }
}
async function getBannerBase(username, weeklyClicks, weeklyRank, allTimeClicks, allTimeRank, flairPath) {
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
        const usernamePng = await textToPng(username, '16px Alkhemikal', 'fill: #dff6f5;');
        const { height: usernameHeight, width: usernameWidth } = await sharp(usernamePng).metadata();
        composites.push({
            input: usernamePng,
            top: 25 - (usernameHeight ?? 0),
            left: 118,
        });
        // flair
        if (flairPath) {
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
                // actually, this cuts off the top and left
                // of the flair image. fiddling with the `left` and `top`
                // of either composite input did not keep the shadow.
                // if only there was native drop shadow support.
                // i guess we might drop the flair shadow? it's very subtle anyway
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
            statText('Weekly Clicks', weeklyClicks),
            weeklyRank ? rankText(weeklyRank) : null,
            statText('All-time Clicks', allTimeClicks),
            allTimeRank ? rankText(allTimeRank) : null,
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
async function getDragonStrip(dragonIds, clientSecret) {
    try {
        let validDragonIds = [];
        const { errors, dragons, } = await ofetch(`https://dragcave.net/api/v2/dragons?ids=${dragonIds.join(',')}`, {
            headers: { Authorization: `Bearer ${clientSecret}` },
            retry: 3,
            retryDelay: 1000,
            timeout: 10000,
        });
        if (errors.length > 0) {
            throw new Error('Errors getting bulk dragons: ' + errors);
        }
        else {
            validDragonIds = Object.keys(dragons).filter((key) => {
                return 'hoursleft' in dragons[key] && dragons[key].hoursleft > 0;
            });
        }
        // log who got left out. works for fogballs so far.
        dragonIds.forEach((id) => {
            if (!validDragonIds.find((i) => i === id)) {
                console.log(`Dragon ${id} was omitted`);
            }
        });
        const dragonBuffers = await Promise.all(validDragonIds.map(async (dragonId) => {
            const response = await ofetch(`https://dragcave.net/image/${dragonId}.gif`, {
                retry: 3,
                retryDelay: 1000,
                timeout: 10000,
            });
            return Buffer.from(await response.arrayBuffer());
            // i can't find ofetch documentation for the proper way to fetch as buffer
        }));
        const dragonImages = dragonBuffers.map((buffer) => sharp(buffer));
        const dragonMetadatas = await Promise.all(dragonImages.map((img) => img.metadata()));
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
        await Promise.all(dragonImages.map(async (dragonImage, index) => {
            composites.push({
                input: await dragonImage.toBuffer(),
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
    catch (error) {
        console.error('Error in getDragonStrip:', error);
        throw error;
    }
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
        console.log(composites);
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
