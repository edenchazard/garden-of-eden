# Garden of Eden

Garden of Eden is a hatchery site for [Dragon Cave](https://dragcave.net).

You can see it in action [here](https://chazza.me/dc/hatchery)!

## Getting started

First, make a copy of the `.env.example` file and name it `.env`. Make sure to put in your Dragon Cave API private key.

The project uses docker, so you'll need to have `docker` and `docker compose` installed. After that, just run:

```bash
npm run dev:docker
```

At this point, you'll want to run the database migrations. Drizzle is used for migrating and interacting with the database.

```bash
npm run dev:docker:migrate
```

## Testing for production

CSurf will cry. A lot. Tears o' plenty. If you don't add the following `env` vars to your `.env`:

```bash
NITRO_CSURF_HTTPS=false
NITRO_CSURF_COOKIE_KEY=csrf
```

## Useful links

- [Drizzle](https://orm.drizzle.team/)
- [Tailwind](https://tailwindcss.com/)
- [Nuxt](https://nuxt.com/)
- [Vue.js](https://vuejs.org/)

## Troubleshooting

If you need to start from scratch, you can run the following commands to remove the docker containers and images whilst keeping the database intact:

```bash
npm run dev:docker:cleanup
```

If you need to remove the database and other volumes you can run:

```bash
npm run dev:docker:cleanup:all
```

_n.b. you will need to rerun the migrations if you decide to remove the volumes_
