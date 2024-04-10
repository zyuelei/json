<script setup lang="ts">

import {useSetConfigDetector} from "../tools/detector";
import {supportAutoType, supportEditTemplateType, systemConfigInterface} from "../interface";
import {windowIsDir, windowShowOpenDialog} from "../tools/windowTool.ts";
import {message} from "ant-design-vue";

const labelCol = {span: 6};
const wrapperCol = {span: 16};
const {getConfig, setConfig, getNativeConfig, setNativeConfig} = useSetConfigDetector({})

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

const chooseRecoverDir = () => {
  const choosePathArr = windowShowOpenDialog();
  if (!choosePathArr || choosePathArr.length != 1) {
    message.error('选择文件夹失败');
    return;
  }
  const choosePath = choosePathArr[0]
  windowIsDir(choosePath, (status) => {
    if (!status) {
      message.error('选择的不是一个文件夹');
      return;
    }
    setNativeConfig('recoverDir', choosePath)
  })
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
      <a-form-item tooltip="只会改变编辑器内的文字大小。建议值：14" label="字体大小">
        <a-input-number :defaultValue="getConfig('fontSize')" style="width: 100%"
                        @change="setConfigLocal('fontSize', $event)" :min="1" :max="50"/>
      </a-form-item>
      <a-form-item tooltip="修改后需要重新格式化一下(ctrl + enter)才会生效。或者新打开一个标签试试。建议值：4"
                   label="缩进宽度">
        <a-input-number :defaultValue="getConfig('tabSize')" style="width: 100%"
                        @change="setConfigLocal('tabSize', $event)" :min="1" :max="20"/>
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
      <a-form-item tooltip="建议使用monaco，当然还是看各自爱好，新建标签生效" label="编辑器">
        <a-radio-group :value="getConfig('render')" @input="setConfigLocal('render', $event.target.value)">
          <a-radio type="number" :value="supportEditTemplateType.monaco">monaco</a-radio>
          <a-radio type="number" :value="supportEditTemplateType.brace">brace</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
          tooltip="设置后在导出归档时无需选择导出文件的父级目录。仅utools环境生效"
          label="导出归档至">
        <a-input-group compact>
          <a-input readonly :value="getNativeConfig('recoverDir')" style="width: calc(100% - 102px)"/>
          <a-button type="primary" @click="chooseRecoverDir">选择</a-button>
          <a-button type="default" @click="setNativeConfig('recoverDir', '')">清除</a-button>
        </a-input-group>
      </a-form-item>

      <!--      <a-row :gutter="0">-->
      <!--        <a-col :span="12">-->
      <!--          <a-form-item tooltip="只会改变编辑器内的文字大小。建议值：14" label="字体大小"-->
      <!--                       :label-col="{ span: 12, offset: 0}"-->
      <!--                       :wrapper-col="{ span: 0, offset: 0}">-->
      <!--            <a-input-number :defaultValue="getConfig('fontSize')" style="width: 100%"-->
      <!--                            @change="setConfigLocal('fontSize', $event)" :min="1" :max="50"/>-->
      <!--          </a-form-item>-->
      <!--        </a-col>-->
      <!--        <a-col :span="12">-->
      <!--          <a-form-item tooltip="修改后需要重新格式化一下(ctrl + enter)才会生效。或者新打开一个标签试试。建议值：4"-->
      <!--                       label="缩进宽度"-->
      <!--                       :label-col="{ span: 12, offset: 0}"-->
      <!--                       :wrapper-col="{ span: 0, offset: 0}">-->
      <!--            <a-input-number :defaultValue="getConfig('tabSize')" style="width: 100%"-->
      <!--                            @change="setConfigLocal('tabSize', $event)" :min="1" :max="20"/>-->
      <!--          </a-form-item>-->
      <!--        </a-col>-->
      <!--      </a-row>-->

      <a-row :gutter="0">
        <a-col :span="24">
          以下按需开启
        </a-col>
        <a-col :span="12">
          <a-form-item tooltip="对 xxx { } xxx 这种前后有非json的字符串很有效" label="自动提取"
                       :label-col="{ span: 12, offset: 0}"
                       :wrapper-col="{ span: 0, offset: 0}"
                       class="noBottom"
          >
            <a-checkbox :checked="getConfig('autoFormat').includes(supportAutoType.extractJson)"
                        @change="setAutoFormat(supportAutoType.extractJson)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item tooltip="对某些聊天软件复制出来的字符串有用" label="移除nbsp" :label-col="{ span: 12, offset: 0}"
                       :wrapper-col="{ span: 0, offset: 0}"
                       class="noBottom">
            <a-checkbox :checked="getConfig('autoFormat').includes(supportAutoType.archive)"
                        @change="setAutoFormat(supportAutoType.archive)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
              tooltip="将自建标签(除了temp标签)的数据保存到缓存中，可以在下次打开本插件时恢复数据。注：在utools环境中，会员可以跨设备同步该缓存"
              label="保存数据" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}"
              class="noBottom">
            <a-checkbox :checked="getConfig('saveData')"
                        @change="setConfigLocal('saveData',$event.target.checked)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item tooltip="当数据过长滚动内容时，顶部显示固定的范围起始位置。仅monaco编辑器生效" label="粘性预览"
                       :label-col="{ span: 12, offset: 0}"
                       :wrapper-col="{ span: 0, offset: 0}"
                       class="noBottom">
            <a-checkbox :disabled="getConfig('render') !== supportEditTemplateType.monaco"
                        :checked="getConfig('stickyEnable')"
                        @change="setConfigLocal('stickyEnable',$event.target.checked)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item tooltip="utools环境生效，从utool入口输入数据进入本插件，会自动新建一个标签" label="载入新标签"
                       :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}"
                       class="noBottom">
            <a-checkbox :checked="getConfig('defaultNewTab')"
                        @change="setConfigLocal('defaultNewTab',$event.target.checked)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item tooltip="当json数据存在多级别的转义时有效，同编辑器下方的【json去除多级转义】功能。注：即使关闭也会在无法解析json时尝试进行一次去除转义的解析"
                       label="去多层转义" :label-col="{ span: 12, offset: 0}"
                       :wrapper-col="{ span: 0, offset: 0}"
                       class="noBottom">
            <a-checkbox :checked="getConfig('autoFormat').includes(supportAutoType.multiEscape)"
                        @change="setAutoFormat(supportAutoType.multiEscape)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item tooltip="双击shift可以重命名标签，即使关闭也可以用编辑器左下角的操作按钮重命名标签"
                       label="快捷重命名" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}"
                       class="noBottom">
            <a-checkbox :checked="getConfig('doubleShiftKeyDown')"
                        @change="setConfigLocal('doubleShiftKeyDown',$event.target.checked)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item tooltip="编辑器内的数据过长时是否折行" label="折行" :label-col="{ span: 12, offset: 0}"
                       :wrapper-col="{ span: 0, offset: 0}"
                       class="noBottom">
            <a-checkbox :checked="getConfig('useWrap')"
                        @change="setConfigLocal('useWrap',$event.target.checked)"/>
          </a-form-item>
        </a-col>
        <a-col :span="24">
          以下不建议开启
        </a-col>
        <a-col :span="12">
          <a-form-item tooltip="尝试在格式化的时候解析 a=1&b=2 这种数据，由于数据多样性，可能导致一些莫名的解析结果"
                       label="自动get" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}"
                       class="noBottom">
            <a-checkbox :checked="getConfig('autoFormat').includes(supportAutoType.get_param)"
                        @change="setAutoFormat(supportAutoType.get_param)"/>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item tooltip="尝试使用utf8对数据进行解码, 如 \x22 \u0031，由于数据多样性，可能导致一些莫名的解析结果"
                       label="强制utf8" :label-col="{ span: 12, offset: 0}" :wrapper-col="{ span: 0, offset: 0}"
                       class="noBottom">
            <a-checkbox :checked="getConfig('autoFormat').includes(supportAutoType.unicode)"
                        @change="setAutoFormat(supportAutoType.unicode)"/>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </div>
</template>

<style scoped>
.noBottom {
  margin-bottom: 2px;
}
</style>
