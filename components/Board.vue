<template>
  <div ref="container" class="container">
    <div
      ref="board"
      class="board"
      :style="`
      width: ${width}px;
      height: ${height}px;
    `"
    >
      <slot name="board"></slot>
    </div>
    <div class="controls">
      <slot name="controls"></slot>
    </div>
  </div>
</template>

<script>
import panzoom from 'panzoom'
export default {
  props: {
    width: {
      type: Number,
      default: 10000,
    },
    height: {
      type: Number,
      default: 10000,
    },
  },
  data() {
    return {
      board: null,
    }
  },
  methods: {
    onMoveEnd() {
      this.$emit('on-move-end', this.getCoordinates())
    },
    moveTo(x, y, zoom) {
      // make coordinates negative since required the panzoom function
      x = -x
      y = -y
      // Set zoom
      if (zoom) {
        this.board.moveTo(0, 0)
        this.board.zoomAbs(0, 0, zoom)
      }
      // Get container offset to center the view
      let offset = this.getCenterOffset()
      let scale = this.board.getTransform().scale
      // Move to the coordinates
      this.board.smoothMoveTo(x * scale + offset.x, y * scale + offset.y, scale)
    },
    // Utility methods
    getCoordinates() {
      // Get container offset to get the center of the screen
      let offset = this.getCenterOffset()
      // Get current transform
      let transform = this.board.getTransform()
      // get x and y coordinates as if fully zoomed in
      let x = Math.round(
        -transform.x / transform.scale + offset.x / transform.scale
      )
      let y = Math.round(
        -transform.y / transform.scale + offset.y / transform.scale
      )
      return { x, y, scale: transform.scale }
    },
    getCenterOffset() {
      let offsetX = this.$refs.container.clientWidth / 2
      let offsetY = this.$refs.container.clientHeight / 2
      return { x: offsetX, y: offsetY }
    },
  },
  mounted() {
    // Enable pan & zoom on the board
    let boardDom = this.$refs.board
    let options = {
      maxZoom: 1,
      minZoom: 0.1,
      initialX: 0,
      initialY: 0,
      initialZoom: 0.3,
      smoothScroll: false,
      /*       increment: 0.1,
      bounds: true,
      boundsPadding: 0.01, */
    }
    this.board = panzoom(boardDom, options)
    // Associate methods to board events
    this.board.on('panend', (e) => {
      this.onMoveEnd()
    })
    this.board.on('zoom', (e) => {
      this.onMoveEnd()
    })
    // Center initial board view
    this.$nextTick(() => {
      this.moveTo(this.width / 2, this.height / 2)
    })
  },
  beforeDestroy() {
    this.board.dispose()
  },
}
</script>

<style scoped>
.container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
.board {
  position: relative;
  margin: 0;
  padding: 0;
  background-image: url(https://i.ibb.co/hyPfS9T/background.png);
}
.board img {
  width: 100%;
  height: 100%;
  image-rendering: crisp-edges;
}
.controls {
  position: absolute;
  padding: 10px;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}
.controls button {
  pointer-events: all;
  margin-right: 10px;
}
</style>
