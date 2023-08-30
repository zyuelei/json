<script setup lang="ts">
import Json from "./Json.vue";
import {ref} from "vue";
import {theme} from 'ant-design-vue';

const themeVal = ref('light');

const toggleTheme = (themeNew: any) => {
  // theme.value === 'light' ? 'dark' : 'light'
  themeVal.value = themeNew;
};

const showSon = ref(false)
// @ts-ignore
if (typeof utools != 'undefined') {
// @ts-ignore
  utools.onPluginReady(() => {
    showSon.value = true;
// @ts-ignore
    if (utools.isDarkColors()) {
      toggleTheme('dark')
    } else {
      toggleTheme('light')
    }
  })

} else {
  // toggleTheme('dark')
  showSon.value = true;
}


</script>

<template>
  <div class="container">
    <a-config-provider :theme="{
      algorithm: themeVal == 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm,
    }">
      <Json :theme="themeVal" v-if="showSon"></Json>
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
