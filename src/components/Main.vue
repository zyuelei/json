<script setup lang="ts">
import Json from "./Json.vue";
import {ref} from "vue";
import {theme} from 'ant-design-vue';
import {windowIsDark, windowPluginReady} from "../tools/windowTool.ts";

const themeVal = ref('light');
const showSon = ref(false)

const toggleTheme = (themeNew: any) => {
  // theme.value === 'light' ? 'dark' : 'light'
  themeVal.value = themeNew;
};

if (windowIsDark()) {
  toggleTheme('dark')
} else {
  toggleTheme('light')
}

windowPluginReady(() => {
  showSon.value = true
});

</script>

<template>
  <div class="container">
    <a-config-provider :theme="{
        algorithm: themeVal == 'light' ? theme.compactAlgorithm : [ theme.compactAlgorithm, theme.darkAlgorithm],
      }">
      <Json :theme="themeVal" @changeTheme="toggleTheme" v-if="showSon"></Json>
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
