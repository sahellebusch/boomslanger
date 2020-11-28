
# 💥  Boomslinger 💥

Boomslinger is a simple to use, freeform object data injector designed to make data setup easy for database level testing. You provide the object, boomslinger will insert it. Boomslinger will also truncate tables for you so you always have a clean slate to work with if you want to.

## Roadmap

I have used this bit of code, or at least something similar, in many projects so I decided to finally make it a publicly available package. For now it conly contains helper methods that I've found valuable. I'll continue to expand this for other use cases, but don't want to get ahead of myself. Have an idea? Open an issue and I'll consider it.

## Contributing

If you'd like to contribute, please follow the [guidelines](CONTRIBUTING.md).

## Usage

Take a look at [the tests](./src/index.spec.ts), it's easy - not hard.

## Developing

There isn't a whole lot going on yet in this repo - so there's not much in the way.

### Prerequisites

* node
* docker
* docker-compose

## Run tests

`npm run test:watch`
