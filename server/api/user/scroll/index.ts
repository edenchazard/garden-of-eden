import { getToken, getServerSession } from '#auth';
import type { RowDataPacket } from 'mysql2';
import type { JWT } from 'next-auth/jwt';
import pool from '~/server/pool';

async function fetchScroll(username: string, token: JWT) {
  return $fetch<
    DragCaveApiResponse<{ hasNextPage: boolean; endCursor: null | number }> & {
      dragons: Record<string, DragonData>;
    }
  >(`https://dragcave.net/api/v2/user?username=${username}&filter=GROWING`, {
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${token.sessionToken}`,
    },
  });
}

async function syncScrollName(token: JWT) {
  const updated = await $fetch<
    DragCaveApiResponse<{
      username: string;
      user_id: number;
    }>
  >('https://dragcave.net/api/v2/me', {
    headers: {
      Authorization: `Bearer ${token.sessionToken}`,
    },
  });

  pool.execute(`UPDATE users SET username = ? WHERE id = ?`, [
    updated.data.username,
    token.userId,
  ]);

  return updated.data;
}

export default defineEventHandler(async (event) => {
  const [token, session] = await Promise.all([
    getToken({ event }) as Promise<JWT>,
    getServerSession(event),
  ]);

  let scrollResponse = await fetchScroll(session?.user.username ?? '', token);

  if (scrollResponse.errors.find(([code]) => code === 4)) {
    // probably a disabled account
    return [];
  }

  if (scrollResponse.errors.find(([code]) => code === 3)) {
    // it's likely they've changed their username.
    const updated = await syncScrollName(token);
    scrollResponse = await fetchScroll(updated.username, token);
  }

  const scroll = Object.values(scrollResponse.dragons);
  const alive = scroll.filter((dragon) => dragon.hoursleft >= 0);

  const con = await pool.getConnection();

  try {
    if (alive.length) {
      await con.beginTransaction();
      // if a dragon that was in the hatchery has been moved to this scroll,
      // we should update its user id to reflect the change of ownership.
      await con.execute(
        con.format(`UPDATE hatchery SET user_id = ? WHERE code IN (?)`, [
          token?.userId,
          alive.map((dragon) => dragon.id),
        ])
      );
      await con.execute(
        con.format(
          `DELETE FROM hatchery WHERE user_id = ? AND code NOT IN (?)`,
          [token?.userId, alive.map((dragon) => dragon.id)]
        )
      );
      await con.commit();
    }

    const [usersDragonsInHatchery] = await con.execute<RowDataPacket[]>(
      `SELECT code, in_garden, in_seed_tray FROM hatchery WHERE user_id = ?`,
      [token?.userId]
    );

    return alive.map<ScrollView>((dragon) => {
      const hatcheryDragon = usersDragonsInHatchery.find(
        (row) => row.code === dragon.id
      );

      return {
        ...dragon,
        in_garden: !!(hatcheryDragon?.in_garden ?? false),
        in_seed_tray: !!(hatcheryDragon?.in_seed_tray ?? false),
      };
    });
  } catch (e) {
    await con.rollback();
    throw e;
  } finally {
    con.release();
  }
});
