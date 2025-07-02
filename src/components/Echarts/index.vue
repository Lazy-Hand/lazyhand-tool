<script setup lang="ts">
import type { ECElementEvent, EChartsType } from 'echarts/core'
import type { ECOption } from './config'
import {useDebounceFn, useResizeObserver} from '@vueuse/core'
import echarts from './config'
import {
  ref,
  shallowRef,
  computed,
  watch,
  markRaw,
  onMounted,
  nextTick,
  onActivated,
  onBeforeUnmount,
  watchSyncEffect
} from "vue";

defineOptions({
  name: 'ECharts',
})
const props = withDefaults(defineProps<Props>(), {
  renderer: 'canvas',
  resize: true,
  theme: 'light'
})
const emit = defineEmits<{
  click: [ECElementEvent]
}>()

interface Props {
  option: ECOption
  renderer?: 'canvas' | 'svg'
  resize?: boolean
  width?: number | string
  height?: number | string
  loading?: boolean
  theme?: 'dark' | 'light'
}

const chartRef = ref<HTMLDivElement | HTMLCanvasElement>()
const chartInstance = shallowRef<EChartsType>()

const chartTheme = computed(() => props.theme === 'dark' ? 'dark' : null)
const options = computed(() => {
  return {
    ...props.option,
    backgroundColor: '',
  }
})

function draw() {
  if (chartInstance.value) {
    chartInstance.value.setOption(options.value, { notMerge: true })
  }
}

watch(props.option, () => {
  draw()
}, { deep: true })

function handleClick(event: ECElementEvent) {
  emit('click', event)
}

function init() {
  if (!chartRef.value)
    return
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }

  chartInstance.value = echarts.getInstanceByDom(chartRef.value)

  if (!chartInstance.value) {
    chartInstance.value = markRaw(
      echarts.init(chartRef.value, chartTheme.value, {
        renderer: props.renderer,
      }),
    )
    chartInstance.value.on('click', handleClick)
    draw()
  }
}

function resize() {
  if (chartInstance.value && props.resize) {
    chartInstance.value.resize({ animation: { duration: 300 } })
  }
}

const debouncedResize = useDebounceFn(resize, 300, { maxWait: 800 })

useResizeObserver(chartRef, debouncedResize)

onMounted(() => {
  nextTick(() => init())
})

watch(
  () => props.theme,
  () => {
    if (chartInstance.value) {
      init()
    }
  },
)

onActivated(() => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
})

onBeforeUnmount(() => {
  chartInstance.value?.dispose()
})

watchSyncEffect(() => {
  if (chartInstance.value) {
    props.loading ? chartInstance.value.showLoading() : chartInstance.value.hideLoading()
  }
})

defineExpose({
  getInstance: () => chartInstance.value,
  resize,
  draw,
})
</script>

<template>
  <div
    id="echarts" ref="chartRef" :style="{
      height: props.height ? `${props.height}px` : '100%',
      width: props.width ? `${props.width}px` : '100%',
    }"
  />
</template>
