import { z } from 'zod';
import { promises as fs, createReadStream } from 'fs';
import { shareScrollQueue } from '~/server/queue';
import { db } from '~/server/db';
import { and, eq, sql, or } from 'drizzle-orm';
import {
  itemsTable,
  userSettingsTable,
  userTable,
  clicksLeaderboardTable,
  hatcheryTable,
} from '~/database/schema';
import { DateTime } from 'luxon';
import path from 'node:path';
import type { H3Event } from 'h3';
import {
  BannerType,
  querySchema,
  type BannerRequestParameters,
  type User,
} from '~/workers/shareScrollWorkerTypes';
import crypto from 'crypto';
import { decrypt } from '~/utils/accessTokenHandling';

const getData = async (userId: number) => {
  const [[weekly], [allTime], dragons] = await Promise.all([
    db
      .select({
        weeklyClicks: clicksLeaderboardTable.clicks_given,
        weeklyRank: clicksLeaderboardTable.rank,
      })
      .from(clicksLeaderboardTable)
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'weekly'),
          eq(
            clicksLeaderboardTable.start,
            DateTime.now().startOf('week').toJSDate()
          ),
          eq(clicksLeaderboardTable.user_id, userId)
        )
      ),
    db
      .select({
        allTimeClicks: sql<number>`SUM(${clicksLeaderboardTable.clicks_given})`,
        allTimeRank: clicksLeaderboardTable.rank,
      })
      .from(clicksLeaderboardTable)
      .where(
        and(
          eq(clicksLeaderboardTable.leaderboard, 'all time'),
          // Yeah, this is literally just to force mysql to use the index.
          eq(clicksLeaderboardTable.start, DateTime.fromMillis(0).toJSDate()),
          eq(clicksLeaderboardTable.user_id, userId)
        )
      ),
    db
      .select({
        code: hatcheryTable.id,
      })
      .from(hatcheryTable)
      .where(
        and(
          eq(hatcheryTable.user_id, userId),
          or(
            eq(hatcheryTable.in_seed_tray, 1),
            eq(hatcheryTable.in_garden, 1)
          )
        )
      ),
  ]);

  return {
    weeklyClicks: weekly?.weeklyClicks ?? 0,
    weeklyRank: weekly?.weeklyRank ?? null,
    allTimeClicks: allTime?.allTimeClicks ?? 0,
    allTimeRank: allTime?.allTimeRank ?? null,
    dragons: dragons.map((dragon) => dragon.code),
  };
};

const getUser = async (userId: number, username: string) => {
  const [user] = await db
    .select({
      id: userTable.id,
      username: userTable.username,
      accessToken: userTable.accessToken,
      flairPath: itemsTable.url,
    })
    .from(userTable)
    .innerJoin(userSettingsTable, eq(userTable.id, userSettingsTable.user_id))
    .leftJoin(itemsTable, eq(userSettingsTable.flair_id, itemsTable.id))
    .where(and(eq(userTable.id, userId), eq(userTable.username, username)));

  if (!user?.accessToken) return null;

  if (user.flairPath) {
    user.flairPath = `items/${user.flairPath}`;
  }

  return user;
};

async function exists(file: string) {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

async function sendJob(
  unique: string,
  user: User,
  filePath: string,
  requestParameters: BannerRequestParameters
) {
  const { bannerCacheExpiry, clientSecret, accessTokenPassword } =
    useRuntimeConfig();
  const expires = bannerCacheExpiry * 1000;
  const jobId = `banner-${unique}`;

  // We don't want to rerun these queries if not enough time has passed.
  const existingJob = await shareScrollQueue.getJob(jobId);

  if (existingJob && Date.now() - existingJob.timestamp < expires) {
    console.log('not met expiry threshold yet.');
    return;
  } else {
    existingJob?.remove();
  }
  const { weeklyClicks, weeklyRank, allTimeClicks, allTimeRank, dragons } =
    await getData(user.id);

  const secret =
    requestParameters.stats === BannerType.garden
      ? clientSecret
      : (function () {
          try {
            return decrypt(user.accessToken ?? '', accessTokenPassword);
          } catch {
            return null;
          }
        })();

  if (!secret) {
    return null;
  }

  await shareScrollQueue.add(
    'shareScrollQueue',
    {
      user,
      filePath,
      dragons,
      secret,
      stats: requestParameters.stats,
      requestParameters,
      data: {
        weeklyClicks,
        weeklyRank,
        allTimeClicks,
        allTimeRank,
      },
    },
    {
      removeOnFail: true,
      jobId,
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 10000,
      },
    }
  );

  return true;
}

function sendNotFound(event: H3Event, extension: string) {
  setResponseStatus(event, 404);

  return sendStream(
    event,
    createReadStream(
      path.resolve(`/src/resources/banner/not_found${extension}`)
    )
  );
}

export default defineEventHandler(async (event) => {
  const paramSchema = z.object({
    userId: z.coerce.number().min(1),
    username: z.string().min(2).max(30),
  });

  const contentTypes = {
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };

  const match = getRouterParams(event).request.match(/^(\d+)-([\w\s-%.]+)$/);
  const query = await querySchema.safeParseAsync(getQuery(event));

  if (!match || !query.success) return setResponseStatus(event, 404);

  const [, userId, username] = match;

  const params = await paramSchema.safeParseAsync({
    userId,
    username,
  });

  if (!params.data || !params.success) return setResponseStatus(event, 404);

  const unique = crypto
    .createHash('sha1')
    .update(JSON.stringify(query.data))
    .digest('hex');

  const filePath = `/cache/scroll/${params.data.userId}-${unique}${query.data.ext}`;
  const contentType = contentTypes[query.data.ext];

  const user = await getUser(
    params.data.userId,
    decodeURIComponent(params.data.username)
  );

  setHeader(event, 'Content-Type', contentType);

  if (!user || (await sendJob(unique, user, filePath, query.data)) === null) {
    return sendNotFound(event, query.data.ext);
  }

  if (await exists(filePath)) {
    setHeader(event, 'Cache-Control', `public, max-age=120`);
    return sendStream(event, createReadStream(filePath));
  }

  return sendStream(
    event,
    createReadStream(`/src/resources/banner/in_progress${query.data.ext}`)
  );
});
