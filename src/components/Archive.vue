<script setup lang="ts">
import type {UnwrapRef} from 'vue';
import {h, onMounted, reactive, ref} from 'vue';
import {useArchiveLocalDirData, useGetPanesData, useSetConfigDetector, useSetPanesData} from "../tools/detector";
import {Form, message, Modal} from "ant-design-vue";
import {archiveDataInterface, panesInterface} from "../interface";
import {QuestionOutlined} from '@ant-design/icons-vue';
import {
  getPathSep,
  windowAddFile,
  windowIsDir,
  windowMkdir,
  windowOpenDir,
  windowReadFile,
  windowReplace,
  windowShowOpenDialog,
  windowValidStr
} from "../tools/windowTool.ts";

import type {Rule} from 'ant-design-vue/es/form';

interface FormState {
  layout: 'local' | 'online';
  name: string;
}

const {getNativeConfig} = useSetConfigDetector({})
const formState: UnwrapRef<FormState> = reactive({
  layout: 'local',
  name: ''
});
const validStr = async (_rule: Rule, value: string) => {
  if (windowValidStr(value)) {
    return Promise.reject('Please input the password again');
  } else {
    return Promise.resolve();
  }
}

const rulesRef = reactive({
  name: [
    {
      required: true,
      message: '请输入归档名',
    },
    {
      validator: validStr,
      message: '归档名包含特殊字符串'
    }
  ],
});
const {validate, validateInfos, resetFields} = Form.useForm(formState, rulesRef, {});
const columns = [
  {
    name: 'Name',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
  },
  {
    name: 'Time',
    dataIndex: 'formatTime',
    key: 'time',
    width: 70,
  },
  {
    title: 'Action',
    key: 'action',
    width: 136,
  },
];


const dataRef = ref<archiveDataInterface[]>([]);
const {
  addArchiveLocalDirData,
  loadArchiveLocalDirData,
  recoverArchiveLocalDirData,
  deleteArchiveLocalDirData,
  getArchiveLocalDirSavePath
} = useArchiveLocalDirData();

const loadData = () => {
  loadArchiveLocalDirData((status, data) => {
    if (status) {
      dataRef.value = [...data]
    }
  })
}

const help = () => {
  const instructions = [
    "可以将某一个时刻的所有自建标签(除temp标签)归档",
    "归档成功后可以在此页面恢复、导出、删除",
    "恢复需要编辑器内无自建标签归档",
    "导出需要选择一个存储的父级文件夹",
    "在'基础设置-导出归档至'，中可以设置默认的存储父级文件夹",
    "删除后无法恢复 ，请谨慎",
    "浏览器环境无法保存文件至本地，故仅utools环境可归档",
    "归档存储在本地，故无法使用utools的数据同步",
    "存储路径为：我的文档/json_xxxxxx ，请勿修改其中数据",
  ];

  let content = h('div',
      instructions.map(instruction => h('p', instruction))
  );

  Modal.info({
    title: '使用说明',
    wrapClassName: 'useDescContainer',
    okText: '我已知晓',
    maskClosable: true,
    content: content,
  });
}

const addArchive = () => {
  validate()
      .then(() => {
        const panesData = JSON.stringify(useGetPanesData());
        addArchiveLocalDirData(formState.name, panesData, (status) => {
          if (!status) {
            message.error('保存异常');
          } else {
            resetFields()
            loadData();
            message.success('保存成功');
          }
        })
      })
      .catch();
}

const validData = (status: boolean, data: panesInterface[]) => {
  if (!status) {
    message.error('恢复时读取数据异常');
    return false;
  }
  const filterData = data.filter((v) => {
    return !v.title || typeof v.content === void 0 || typeof v.key === void 0
  });
  if (filterData.length) {
    message.error('恢复时数据转换异常');
    return false;
  }

  return data.map((v) => {
    v.init = false
    return v;
  });
}
const recoverArchive = (key: string) => {
  recoverArchiveLocalDirData(key, (status, value) => {
    const pan = useGetPanesData();
    if (pan.length > 1 || pan[0].key != 0) {
      message.error('标签栏已有数据无法恢复');
      return;
    }
    const result = validData(status, value);
    if (!result) {
      return;
    }
    useSetPanesData(result)
    message.success('恢复成功');
  });
}

const deleteArchive = (key: string) => {
  deleteArchiveLocalDirData(key, (status) => {
    if (!status) {
      message.error('删除失败');
      return;
    }
    loadData()
    message.success('删除成功');
  })
}
onMounted(() => {
  loadData();
})
const exportArchive = (data: archiveDataInterface) => {
  let choosePath = getNativeConfig('recoverDir');
  if (!choosePath) {
    const choosePathArr = windowShowOpenDialog();
    if (!choosePathArr || choosePathArr.length != 1) {
      message.error('选择文件夹失败');
      return;
    }
    choosePath = choosePathArr[0]
  }
  windowIsDir(choosePath, (status) => {
    if (!status) {
      message.error('选择的不是一个文件夹');
      return;
    }
    const dataPath = getArchiveLocalDirSavePath() + data.key;
    windowReadFile(dataPath, (status, value) => {
      const parseData: panesInterface[] = JSON.parse(value) || [];
      const result = validData(status, parseData);
      if (!result) {
        return;
      }
      const pathSep = getPathSep();
      const savePath = choosePath + pathSep + data.time + '_' + windowReplace(data.name) + pathSep;
      windowMkdir(savePath, (status) => {
        if (!status) {
          message.error('创建保存文件夹失败');
          return;
        }
        result.map((v: panesInterface) => {
          if (!v.key) {
            return;
          }
          const fileName = v.key + '_' + windowReplace(v.title) + '.json';
          windowAddFile(savePath + fileName, v.content)
        })
        windowOpenDir(savePath)
      })
    })
  })
}
</script>

<template>

  <a-flex gap="middle" vertical style="height: 100%">
    <a-flex>
      <a-form layout="inline" :model="formState">
        <!--      <a-form-item label="">-->
        <!--        <a-radio-group v-model:value="formState.layout">-->
        <!--          <a-radio-button value="online">云端</a-radio-button>-->
        <!--          <a-radio-button value="local">本地</a-radio-button>-->
        <!--        </a-radio-group>-->
        <!--      </a-form-item>-->
        <a-form-item label="" v-bind="validateInfos.name" style="width: 216px;margin-left: 12px">
          <a-input v-model:value="formState.name" placeholder="请输入归档名"/>
        </a-form-item>
        <a-form-item>
          <a-button type="default" @click="addArchive">新建归档</a-button>
        </a-form-item>
        <a-form-item>
          <a-button shape="circle" size="small" :icon="h(QuestionOutlined)" @click="help">
          </a-button>
        </a-form-item>
      </a-form>
    </a-flex>
    <a-flex>
      <a-divider style="margin:4px" :plain="true"></a-divider>
    </a-flex>
    <a-flex flex="1" v-show="formState.layout=='local'"
            style="overflow-y: auto;height: 100%;">
      <a-table :columns="columns" :show-header="false" :data-source="dataRef"
               :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            {{ record.name }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="recoverArchive(record.key)">恢复</a-button>
            <a-button type="link" size="small" @click="exportArchive(record)">导出</a-button>

            <a-popconfirm
                title="删除后不可恢复，确认删除？"
                ok-text="确认"
                placement="left"
                cancel-text="取消"
                @confirm="deleteArchive(record.key)"
            >
              <a-button type="link" danger size="small">删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-flex>
  </a-flex>

  <!--    <div v-show="formState.layout=='online'">-->
  <!--      <a-divider style="margin-top: 14px" :plain="true">目前仅可保存五个云端归档</a-divider>-->

  <!--      <a-table :columns="columns" :show-header="false" :data-source="data"-->
  <!--               :pagination="{hideOnSinglePage:true}">-->
  <!--        <template #bodyCell="{ column, record }">-->
  <!--          <template v-if="column.key === 'name'">-->
  <!--            {{ record.name }}-->
  <!--          </template>-->
  <!--          <template v-else-if="column.key === 'time'">-->
  <!--            {{ record.time }}-->
  <!--          </template>-->
  <!--          <template v-else-if="column.key === 'action'">-->
  <!--            <a-button type="link" size="small">导出</a-button>-->
  <!--            <a-button type="link" size="small">恢复</a-button>-->
  <!--            <a-button type="link" size="small" danger>删除</a-button>-->
  <!--          </template>-->
  <!--        </template>-->
  <!--      </a-table>-->
  <!--    </div>-->

  <!--    <div v-show="formState.layout=='local'">-->
  <!--      <a-divider style="margin-top: 14px" :plain="true"></a-divider>-->
  <!--          <a-card hoverable style="width: 300px;height: 300px;text-align: center;margin: auto">-->
  <!--            <a-flex gap="middle" vertical>-->
  <!--              <a-flex :vertical="true" justify="space-between" align="center">-->
  <!--                <ImportOutlined style="font-size: 50px;margin-top: 40px"></ImportOutlined>-->
  <!--              </a-flex>-->
  <!--              <a-flex :vertical="true" justify="space-between" align="center">-->
  <!--                <div style="text-align: center;margin-top: 40px">本地归档无法查看列表</div>-->
  <!--                <div style="text-align: center;margin-top: 40px">点击加载本地归档文件夹恢复至tab</div>-->
  <!--              </a-flex>-->
  <!--            </a-flex>-->

  <!--          </a-card>-->
  <!--    </div>-->
</template>

<style scoped>

</style>
