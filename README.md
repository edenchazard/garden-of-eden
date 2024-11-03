# Garden of Eden

Garden of Eden is a hatchery site for [Dragon Cave](https://dragcave.net).

You can see it in action [here](https://chazza.me/dc/hatchery)!

## Getting started

First, make a copy of the `.env.example` file and name it `.env`. Make sure to put in your Dragon Cave API private key.

The project uses docker, so you'll need to have `docker` and `docker compose` installed. After that, just run:

```bash
docker compose -f docker-compose.dev.yml up
```

At this point, you'll want to run the database migrations. Drizzle is used for migrating and interacting with the database.

```bash
docker compose exec hatchery bash -c "npm run db:migrate"
```

# Useful links

### Drizzle

- [Drizzle](https://orm.drizzle.team/)
- [Tailwind](https://tailwindcss.com/)
- [Nuxt](https://nuxt.com/)
- [Vue.js](https://vuejs.org/)
