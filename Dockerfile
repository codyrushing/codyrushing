FROM oven/bun
COPY . .
WORKDIR /packages/site
RUN bun install
RUN bun run build