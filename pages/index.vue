<template>
  <div class="container">
    <div v-if="loading" class="loading-overlay">
      <p>
        Loading<br />
        The page may become unresponsive while generating the map.
      </p>
    </div>
    <Board
      :width="world.size.width * world.size.block"
      :height="world.size.height * world.size.block"
    >
      <template v-slot:board>
        <img v-if="mapBase64" :src="mapBase64" alt="Red dot" class="map" />
        <canvas
          ref="canvas"
          :width="world.size.width"
          :height="world.size.height"
          class="map"
        ></canvas>
      </template>
      <template v-slot:controls>
        <h1>Pixel island generator <span>0.5</span></h1>
        <button @click="displaySettings = !displaySettings">
          {{ displaySettings ? 'Hide' : 'Show' }}
        </button>
        <div v-show="displaySettings" class="settings">
          <div class="input-box">
            Type:
            <select v-model="world.type" name="type">
              <option value="archipelago">Orbed archipelago</option>
            </select>
          </div>
          <div class="input-box">
            Size:
            <select v-model="size" name="size" style="max-width: 120px">
              <option value="small">Small (500x500)</option>
              <option value="medium">Medium (1000x1000)</option>
            </select>
          </div>
          <br />
          <div class="input-box">
            Elevation seed:
            <input
              v-model="world.seed.elevation"
              type="text"
              placeholder="Elevation seed"
              name="Elevation seed"
            />
            <button @click="randomSeed('elevation')">Random</button>
          </div>
          <br />
          <div class="input-box">
            Moisture seed:
            <input
              v-model="world.seed.moisture"
              type="text"
              placeholder="Moisture Seed"
              name="Moisture Seed"
            />
            <button @click="randomSeed('moisture')">Random</button>
          </div>
          <br />
          <div class="input-box">
            Render mode:
            <select v-model="world.format" name="size" style="max-width: 120px">
              <option value="png">Base64</option>
              <option value="collection">Canvas</option>
            </select>
          </div>
          <br />
          <a
            v-show="mapBase64 || canvas"
            download="map.png"
            :href="canvas ? $refs.canvas.toDataURL() : mapBase64"
            ><button>Download</button></a
          >
          <button class="render-btn" @click="render()">Generate</button>
        </div>
      </template>
    </Board>
    <div class="footer">
      <p>
        Made by
        <a
          href="https://github.com/vesamet/"
          target="_blank"
          class="creator-link"
          >Gwenaël Guyot</a
        >
        <a
          href="https://github.com/vesamet/pixel-island-generator"
          target="_blank"
          ><button><img src="@/assets/github.svg" alt="github" /></button
        ></a>
      </p>
    </div>
  </div>
</template>

<script>
import Board from '@/components/Board'
import world from '@/utilities/world'
export default {
  components: {
    Board,
  },
  data() {
    return {
      world: {
        size: {
          width: 500,
          height: 500,
          block: 10,
        },
        seed: {
          elevation: '19549293178942729794',
          moisture: '48424901343056239472',
        },
        type: 'archipelago',
        format: 'collection',
      },
      size: 'small',
      mapBase64: '',
      canvas: false,
      loading: false,
      displaySettings: true,
    }
  },
  methods: {
    async render() {
      // Reset render state
      this.mapBase64 = ''
      this.canvas = false
      // Set size
      switch (this.size) {
        case 'small':
          this.world.size.width = 500
          this.world.size.height = 500
          break
        case 'medium':
          this.world.size.width = 1000
          this.world.size.height = 1000
          break
      }
      this.loading = true
      // Insure the browser display the loading overlay
      await this.sleep(200)
      this.$nextTick(() => {
        // Define the render type and perform it.
        switch (this.world.format) {
          case 'png':
            this.mapBase64 = world.generate(this.world)
            break
          case 'collection':
            this.canvas = true
            let blocks = world.generate(this.world)
            const ctx = this.$refs.canvas.getContext('2d')
            blocks.forEach((block) => {
              let rgb = block.biome.rgb
              ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
              ctx.fillRect(block.position.x - 1, block.position.y - 1, 1, 1)
            })
            break
        }
        this.loading = false
      })
    },
    randomSeed(seedType) {
      this.world.seed[seedType] = world.getRandomSeed(20)
    },
    downloadCanvas() {
      this.mapBase64 = this.$refs.canvas.toDataURL()
      // var link = document.createElement('a')
      // link.download = 'map.png'
      // link.href = this.$refs.canvas.toDataURL()
      // link.click()
    },
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },
  },
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Langar&display=swap');
body {
  font-size: 12px;
  background-color: #3670b5;
}
body,
button,
input,
select {
  font-family: 'Langar', cursive;
}

.container {
  position: relative;
}
.settings {
  margin-top: 5px;
}
h1 {
  color: white;
  text-shadow: 0 0 5px rgb(57, 29, 158), 0 0 7px black;
}
h1 > span {
  font-size: 0.6em;
}
a.creator-link {
  color: white;
  text-shadow: 0 0 3px rgb(57, 29, 158), 0 0 3px black;
  text-decoration: none;
  padding-right: 10px;
}
.map {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  image-rendering: crisp-edges;
}
.input-box {
  background-color: rgb(1, 30, 75);
  box-shadow: 0 0 3px rgb(57, 29, 158), 0 0 3px black;
  padding: 3px;
  margin: 4px 4px;
  display: inline-block;
  color: white;
}
button {
  box-shadow: 0 0 3px rgb(57, 29, 158), 0 0 3px black;
  background-color: rgb(1, 30, 75);
  color: white;
  padding: 5px;
  border: none;
  border-radius: 5px;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 2px;
  font-size: 1em;
  transition: all 0.3s ease;
}
button:hover {
  cursor: pointer;
  background-color: rgb(27, 63, 117);
}
.render-btn {
  background-color: rgb(75, 136, 40);
  box-shadow: 0 0 3px rgb(9, 80, 21), 0 0 3px rgb(140, 247, 119);
  margin-top: 3px;
}
.render-btn:hover {
  background-color: rgb(116, 192, 72);
}
.loading-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 2;
  color: white;
  background-color: black;
  opacity: 0.8;
  text-align: center;
}
.loading-overlay > p {
  font-size: 2em;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}
.footer {
  position: absolute;
  right: 5px;
  bottom: 5px;
  pointer-events: all;
  z-index: 3;
}
.footer img {
  width: 20px;
}
.footer button {
  padding: 3px 3px 0 3px;
}
</style>
