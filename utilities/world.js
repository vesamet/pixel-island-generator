/*
-------------------
World component
-------------------
Allow the procedural generation of worlds.
Each world is divided in "blocks", which define a small zone
that holds content such as flora, subsurface, structures, 
units, etc. (a block mesurement is around 20 x 20 meters)
*/

// External libraries
import SimplexNoise from 'simplex-noise'
import { cloneDeep } from 'lodash'
import Joi from '@hapi/joi'
import { Bitmap } from '@/utilities/bitmap'
// Component
export default {
  // 🗡 Main methods
  // Top-level functions with input validation.
  generate(options = {}) {
    // Validate options
    let { value: world, error } = Joi.object({
      type: Joi.string()
        .valid('orbedArchipelago', 'archipelago')
        .default('archipelago'),
      size: Joi.object({
        width: Joi.number().integer().min(1).max(34000).default(10),
        height: Joi.number().integer().min(1).max(34000).default(10),
      }).default(),
      seed: Joi.object({
        elevation: Joi.string().trim().alphanum().min(1).max(100),
        moisture: Joi.string().trim().alphanum().min(1).max(100),
      }).default(),
      chunk: Joi.object({
        start: Joi.object({
          width: Joi.number()
            .integer()
            .min(1)
            .max(Joi.ref('....size.width'))
            .required(),
          height: Joi.number()
            .integer()
            .min(1)
            .max(Joi.ref('....size.height'))
            .required(),
        }).required(),
        end: Joi.object({
          width: Joi.number()
            .integer()
            .min(Joi.ref('...start.width'))
            .max(Joi.ref('....size.width'))
            .required(),
          height: Joi.number()
            .integer()
            .min(Joi.ref('...start.height'))
            .max(Joi.ref('....size.height'))
            .required(),
        }).required(),
      }),
      format: Joi.string().valid('collection', 'png').default('collection'),
    }).validate(options, {
      stripUnknown: true,
    })
    if (error) return { error }
    if (!world.seed.elevation) world.seed.elevation = this.getRandomSeed()
    if (!world.seed.moisture) world.seed.moisture = this.getRandomSeed()
    // Define number of blocks to generate
    // (If a chunk is specified, use it, else render the whole map)
    let start = {
      x: world.chunk?.start?.width || 1,
      y: world.chunk?.start?.height || 1,
    }
    let end = {
      x: world.chunk?.end?.width || world.size.width,
      y: world.chunk?.end?.height || world.size.height,
    }
    // Generate world blocks
    let blocks = []
    for (let x = start.x; x <= end.x; x++) {
      for (let y = start.y; y <= end.y; y++) {
        const biome = this.getBiome(world, { x, y })
        blocks.push({
          position: {
            x,
            y,
          },
          biome,
        })
      }
    }
    // Return blocks specified format
    switch (world.format) {
      case 'collection':
        return blocks
        break
      case 'png':
        return this.createMapImage(world, blocks)
        break
    }
  },
  // 🗡 Helper methods
  // Support main methods. Should not be called directly.
  getBiome(world = {}, block = { x: 0, y: 0 }) {
    // Define attributes
    // Define noise
    const gen1 = new SimplexNoise(world.seed.elevation)
    const gen2 = new SimplexNoise(world.seed.moisture)
    function noise1(nx, ny) {
      return gen1.noise2D(nx, ny) / 2 + 0.5
    }
    function noise2(nx, ny) {
      return gen2.noise2D(nx, ny) / 2 + 0.5
    }
    // Define elevation
    let e
    const noizeZoom = 4
    const nx = block.x / world.size.width - 0.5
    const ny = block.y / world.size.height - 0.5
    switch (world.size.type) {
      case 'orbedArchipelago':
        e =
          1.4 * noise1(1 * noizeZoom * nx, 1 * noizeZoom * ny) +
          0.74 * noise1(2 * noizeZoom * nx, 2 * noizeZoom * ny) +
          0.0 * noise1(4 * noizeZoom * nx, 4 * noizeZoom * ny) +
          0.29 * noise1(8 * noizeZoom * nx, 8 * noizeZoom * ny) +
          0.0 * noise1(16 * noizeZoom * nx, 16 * noizeZoom * ny) +
          0.02 * noise1(32 * noizeZoom * nx, 32 * noizeZoom * ny)
        e /= 1.0 + 0.72 + 0.0 + 0.29 + 0.0 + 0.02
        e = e ** 4
        break
      case 'archipelago':
        e =
          1.4 * noise1(1 * noizeZoom * nx, 1 * noizeZoom * ny) +
          0.74 * noise1(2 * noizeZoom * nx, 2 * noizeZoom * ny) +
          0.0 * noise1(4 * noizeZoom * nx, 4 * noizeZoom * ny) +
          0.29 * noise1(8 * noizeZoom * nx, 8 * noizeZoom * ny) +
          0.0 * noise1(16 * noizeZoom * nx, 16 * noizeZoom * ny) +
          0.02 * noise1(32 * noizeZoom * nx, 32 * noizeZoom * ny)
        e /= 1.0 + 0.72 + 0.0 + 0.29 + 0.0 + 0.02
        e = e ** 7
        break
      default:
        e =
          1.4 * noise1(1 * noizeZoom * nx, 1 * noizeZoom * ny) +
          0.74 * noise1(2 * noizeZoom * nx, 2 * noizeZoom * ny) +
          0.0 * noise1(4 * noizeZoom * nx, 4 * noizeZoom * ny) +
          0.29 * noise1(8 * noizeZoom * nx, 8 * noizeZoom * ny) +
          0.0 * noise1(16 * noizeZoom * nx, 16 * noizeZoom * ny) +
          0.02 * noise1(32 * noizeZoom * nx, 32 * noizeZoom * ny)
        e /= 1.0 + 0.72 + 0.0 + 0.29 + 0.0 + 0.02
        e = e ** 4
    }

    // Exponentialy decrease elevation as we get closer to map borders
    const distanceX =
      (world.size.width / 2 - block.x) * (world.size.width / 2 - block.x)
    const distanceY =
      (world.size.height / 2 - block.y) * (world.size.height / 2 - block.y)
    const distanceToCenter = Math.sqrt(distanceX + distanceY)
    const d = distanceToCenter / world.size.width
    switch (world.size.type) {
      case 'orbedArchipelago':
        if (d > 0.45) {
          e = e - (d - 0.45) * 18
        }
        break
      case 'archipelago':
        if (d > 0.35) {
          e = e - (d - 0.35) * 4
        }
        if (d > 0.45) {
          e = e - (d - 0.45) * 18
        }
        break
      default:
        if (d > 0.45) {
          e = e - (d - 0.45) * 18
        }
        break
    }

    // Define moisture
    let m
    m =
      1.0 * noise2(1 * noizeZoom * nx, 1 * noizeZoom * ny) +
      0.75 * noise2(2 * noizeZoom * nx, 2 * noizeZoom * ny) +
      0.33 * noise2(4 * noizeZoom * nx, 4 * noizeZoom * ny) +
      0.33 * noise2(8 * noizeZoom * nx, 8 * noizeZoom * ny) +
      0.33 * noise2(16 * noizeZoom * nx, 16 * noizeZoom * ny) +
      0.5 * noise2(32 * noizeZoom * nx, 32 * noizeZoom * ny)
    m /= 1.0 + 0.75 + 0.33 + 0.33 + 0.33 + 0.5

    // Retrieve block
    return this.biomeRules(e, m)
  },
  biomeRules(e, m) {
    let types = {
      // Biomes name and color
      ocean: {
        code: 'ocean',
        name: 'Ocean',
        rgb: [54, 112, 181],
      },
      deepWater: {
        code: 'deepWater',
        name: 'Deep water',
        rgb: [75, 130, 196],
      },
      shallow: {
        code: 'shallow',
        name: 'Ocean',
        rgb: [54, 112, 181],
      },
      beach: {
        code: 'beach',
        name: 'Beach',
        rgb: [227, 204, 150],
      },
      steppe: {
        code: 'steppe',
        name: 'Steppe',
        rgb: [117, 116, 116],
      },
      overgrownCliffs: {
        code: 'overgrownCliffs',
        name: 'Overgrown cliffs',
        rgb: [171, 169, 169],
      },
      highlands: {
        code: 'highlands',
        name: 'Highlands',
        rgb: [209, 207, 207],
      },
      tundra: {
        code: 'tundra',
        name: 'Tundra',
        rgb: [188, 188, 191],
      },
      snowyMountains: {
        code: 'snowyMountains',
        name: 'Snowy mountains',
        rgb: [252, 253, 255],
      },
      temperateDesert: {
        code: 'temperateDesert',
        name: 'Temperate desert',
        rgb: [241, 220, 169],
      },
      shrubland: {
        code: 'shrubland',
        name: 'Shrubland',
        rgb: [136, 153, 119],
      },
      taiga: {
        code: 'taiga',
        name: 'Taiga',
        rgb: [152, 169, 119],
      },
      grassland: {
        code: 'grassland',
        name: 'Grassland',
        rgb: [136, 171, 85],
      },
      temperateDeciduousForest: {
        code: 'temperateDeciduousForest',
        name: 'Temperate deciduous forest',
        rgb: [70, 102, 86],
      },
      temperateRainForest: {
        code: 'temperateRainForest',
        name: 'Temperate rain forest',
        rgb: [67, 136, 85],
      },
      subtropicalDesert: {
        code: 'subtropicalDesert',
        name: 'Subtropical Desert',
        rgb: [245, 237, 190],
      },
      tropicalSeasonalForest: {
        code: 'tropicalSeasonalForest',
        name: 'Tropical seasonal forest',
        rgb: [99, 150, 101],
      },
      plains: {
        code: 'plains',
        name: 'Plains',
        rgb: [219, 217, 169],
      },
      savanna: {
        code: 'savanna',
        name: 'Savanna',
        rgb: [204, 201, 145],
      },
      tropicalRainForest: {
        code: 'tropicalRainForest',
        name: 'Tropical rain forest',
        rgb: [103, 147, 89],
      },
    }
    // Conditions of biomes repartition
    if (e < 0.08) return types.ocean
    if (e < 0.09) return types.deepWater
    if (e < 0.1) return types.shallow
    if (e < 0.115) return types.beach

    if (e > 0.8) {
      if (m < 0.1) return types.steppe
      if (m < 0.2) return types.overgrownCliffs
      if (m < 0.3) return types.highlands
      if (m < 0.5) return types.tundra
      return types.snowyMountains
    }

    if (e > 0.6) {
      if (m < 0.33) return types.temperateDesert
      if (m < 0.66) return types.shrubland
      return types.taiga
    }

    if (e > 0.3) {
      if (m < 0.16) return types.temperateDesert
      if (m < 0.5) return types.grassland
      if (m < 0.83) return types.temperateDeciduousForest
      return types.temperateRainForest
    }

    if (m < 0.16) return types.subtropicalDesert
    if (m < 0.33) return types.grassland
    if (m < 0.55) return types.tropicalSeasonalForest
    if (m < 0.6) return types.plains
    if (m < 0.7) return types.savanna
    return types.tropicalRainForest
  },
  getBiomeContent(biomeType) {
    let biomeContent = cloneDeep(this.data.biomes[biomeType])
    Object.entries(biomeContent).forEach((entry) => {
      const [key, value] = entry
      biomeContent[key] = this.data.content[key][value]
    })
    return biomeContent
  },
  createMapImage(world, blocks) {
    let bmp = new Bitmap(world.size.width, world.size.height)
    blocks.forEach((block) => {
      bmp.pixel[block.position.x - 1][block.position.y - 1] = [
        block.biome.rgb[0] / 255,
        block.biome.rgb[1] / 255,
        block.biome.rgb[2] / 255,
        1,
      ]
    })
    return bmp.dataURL()
  },
  getRandomSeed(digits) {
    let seed = ''
    if (!digits) digits = 30
    for (let index = 0; index < digits; index++) {
      seed = `${seed}${Math.floor(Math.random() * 10)}`
    }
    return seed
  },
}
