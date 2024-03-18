<script setup lang="ts">
import Json from "./Json.vue";
import {onBeforeUnmount, ref} from "vue";
import {theme} from 'ant-design-vue';
import {windowIsDark, windowPluginReady} from "../tools/windowTool.ts";
import {useSetConfigDetector} from "../tools/detector";
import {configListenerInterface} from "../interface";

const themeVal = ref('light');
const showSon = ref(false)

const onConfigChange: configListenerInterface = (key, value) => {
  if (key == 'theme') {
    themeVal.value = value as string;
  }
};
const {setConfig, unConfigChange} = useSetConfigDetector({
  onConfigChange: onConfigChange
})

if (windowIsDark()) {
  setConfig('theme', 'dark')
} else {
  setConfig('theme', 'light')
}

windowPluginReady(() => {
  showSon.value = true
});

onBeforeUnmount(() => {
  unConfigChange(onConfigChange)
});

</script>

<template>
  <div class="container">
    <a-config-provider :theme="{
        algorithm: themeVal == 'light' ? theme.compactAlgorithm : [ theme.compactAlgorithm, theme.darkAlgorithm],
      }">
      <Json v-if="showSon"></Json>
    </a-config-provider>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  width: 100%;
  height: 100%;
}
</style>
