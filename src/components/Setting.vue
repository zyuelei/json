<script setup lang="ts">

import {useSetConfigDetector} from "../tools/detector";
import {supportAutoType, supportEditTemplateType, systemConfigInterface} from "../interface";

const labelCol = {span: 6};
const wrapperCol = {span: 16};
const {getConfig, setConfig} = useSetConfigDetector({})

const setConfigLocal = <T extends keyof systemConfigInterface>(key: T, value: systemConfigInterface[T]) => {
  switch (key) {
    case "tabSize":
      setConfig('tabSize', parseInt(value as string))
      break;
    case "fontSize":
      setConfig('fontSize', parseInt(value as string))
      break;
    case "render":
      setConfig('render', parseInt(value as string) as supportEditTemplateType)
      break;
    default:
      setConfig(key, value)
      break;
  }
}
const setAutoFormat = (key: supportAutoType) => {
  let configAutoFormat = getConfig('autoFormat');
  let extractIndex = configAutoFormat.indexOf(key);
  if (extractIndex > -1) {
    configAutoFormat.splice(extractIndex, 1);
  } else {
    configAutoFormat.push(key)
  }
  setConfig('autoFormat', configAutoFormat)
}


// const instructions = [
//   "默认行为：粘贴自动格式化json，支持unicode字符(如：\\x22、\\u0031)的转码自动格式化 快捷键：ctrl + v",
//   "格式化：在【选中处/全局】一些需要二次格式化的时候(如：[get]后)可手动调用 快捷键：ctrl + center / alt + enter",
//   "新建tab：ctrl + t / alt + t",
//   "新建tab并粘贴格式化：ctrl + n / alt + n",
//   "新建tab并粘贴【选中处/光标处】内容格式化：ctrl + j / alt + j",
//   "切换tab：ctrl + tab  /  ctrl + shift + tab",
//   "关闭tab：ctrl + q / alt + q",
//   "重命名tab：双击shift",
//   "锁定/解锁tab：锁定后无法通过[关闭tab]快捷键关闭当前tab 快捷键：ctrl + shift + L / alt + shift + L",
//   "get：在【光标处/全局】解析get参数，并尝试转为json 示例：a=1&b=1 快捷键：alt + 1",
//   "url：在【光标处/全局】url_decode，并尝试转为json 示例：%7B%22a%22%3A%221%22%7D 快捷键：alt + 2",
//   "base64：在【光标处/全局】进行url_decode及base64_decode，并尝试转为json 示例：eyJhIjoiMSJ9 快捷键：alt + 3",
//   "serialize：在【光标处/全局】进行unserialize，并尝试转为json 快捷键：alt + 4",
//   "timestamp：在【光标处/全局】进行【10位时间戳/y-m-d H:i:s】格式的转换,若无法转换则会插入当前时间的10位时间戳 快捷键：alt + 5",
//   "unicode：在【光标处/全局】进行unicode_decode解码，并尝试转为json 示例 \\x22 \\u0031 快捷键：alt + 6",
//   "复制form：在【选中处/全局】复制key:value格式的json数据，用于postman等软件的导入 快捷键：alt + 8",
//   "复制压缩：在【选中处/全局】复制去除回车、空格后的压缩数据 快捷键：alt + 9",
//   "仅粘贴：在【选中处/全局】粘贴，并不做格式化操作 快捷键：alt + 0",
//   "注释：【全局】指当前tab内所有内容；【光标处】指被光标在双引号包裹的单行字符串中；【选中处】指光标选中的内容",
//   "快捷键仅针对windows的utools环境，其余环境可能会略有不同或无法支持",
// ];
//
// let content = h('div',
//     instructions.map(instruction => h('p', instruction))
// );
//
// Modal.info({
//   width: '100%',
//   title: '使用说明',
//   wrapClassName: 'useDescContainer',
//   okText: '这不是小菜一碟',
//   content: content,
// });

</script>

<template>
  <div>
    <a-form :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item label="tab大小">
        <a-input-number :value="getConfig('tabSize')" style="width: 100%"
                        @input="setConfigLocal('tabSize', $event.target.value)" :min="1" :max="100"/>
      </a-form-item>
      <a-form-item label="字体大小">
        <a-input-number :value="getConfig('fontSize')" style="width: 100%"
                        @input="setConfigLocal('fontSize', $event.target.value)" :min="1" :max="100"/>
      </a-form-item>
      <!--      <a-form-item label="printMargin">-->
      <!--        <a-checkbox :checked="getConfig('printMargin')" @change="setConfigLocal('printMargin', $event.target.checked)"/>-->
      <!--      </a-form-item>-->
      <a-form-item label="主题">
        <a-radio-group :value="getConfig('theme')" @input="setConfigLocal('theme', $event.target.value)">
          <a-radio value="light">明亮</a-radio>
          <a-radio value="dark">黑暗</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="渲染器">
        <a-radio-group :value="getConfig('render')" @input="setConfigLocal('render', $event.target.value)">
          <a-radio type="number" :value="supportEditTemplateType.monaco">monaco</a-radio>
          <a-radio type="number" :value="supportEditTemplateType.brace">brace</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-row :gutter="0">
        <a-col :span="24">
          以下按需开启
        </a-col>
        <a-col :span="12">
          <a-form-item label="去除首尾" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}">
            <a-checkbox :checked="getConfig('autoFormat').includes(supportAutoType.extractJson)"
                        @change="setAutoFormat(supportAutoType.extractJson)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="移除nbsp" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}">
            <a-checkbox :checked="getConfig('autoFormat').includes(supportAutoType.archive)"
                        @change="setAutoFormat(supportAutoType.archive)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="保存数据" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}">
            <a-checkbox :checked="getConfig('saveData')"
                        @change="setConfigLocal('saveData',$event.target.checked)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="重命名快捷" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}">
            <a-checkbox :checked="getConfig('doubleShiftKeyDown')"
                        @change="setConfigLocal('doubleShiftKeyDown',$event.target.checked)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="自动新tab" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}">
            <a-checkbox :checked="getConfig('defaultNewTab')"
                        @change="setConfigLocal('defaultNewTab',$event.target.checked)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="折行" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}">
            <a-checkbox :checked="getConfig('useWrap')"
                        @change="setConfigLocal('useWrap',$event.target.checked)"/>
          </a-form-item>
        </a-col>
        <a-col :span="24">
          以下不建议开启
        </a-col>
        <a-col :span="12">
          <a-form-item label="自动get" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}">
            <a-checkbox :checked="getConfig('autoFormat').includes(supportAutoType.get_param)"
                        @change="setAutoFormat(supportAutoType.get_param)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="强制utf8" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}">
            <a-checkbox :checked="getConfig('autoFormat').includes(supportAutoType.unicode)"
                        @change="setAutoFormat(supportAutoType.unicode)"/>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </div>
</template>

<style scoped>

</style>
