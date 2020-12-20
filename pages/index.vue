<template>
  <div class="container">
    <div v-if="loading" class="loading-overlay">
      <p>
        Loading<br />
        The page may become unresponsive while generating the map.
      </p>
    </div>
    <div class="copyright-overlay"></div>
    <Board
      :width="world.size.width * world.size.block"
      :height="world.size.height * world.size.block"
    >
      <template v-slot:board>
        <img :src="mapBase64" alt="Red dot" class="map" />
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
            <select v-model="size" name="size" style="max-width: 120px;">
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
          <a v-if="mapBase64" download="map.png" :href="mapBase64"
            ><button>Download</button></a
          >
          <button class="render-btn" @click="render()">Generate</button>
        </div>
      </template>
    </Board>
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
        format: 'png',
      },
      size: 'small',
      mapBase64: '',
      loading: false,
      displaySettings: true,
    }
  },
  methods: {
    async render() {
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
      await this.sleep(200)
      this.$nextTick(() => {
        this.mapBase64 = world.generate(this.world)
        this.loading = false
      })
    },
    randomSeed(seedType) {
      this.world.seed[seedType] = world.getRandomSeed(20)
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
.map {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
body {
  background-color: #7dafda;
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
</style>