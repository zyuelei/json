<script setup lang="ts">
import type {UnwrapRef} from 'vue';
import {reactive} from 'vue';
import {useArchiveLocalDirData} from "../tools/detector";
import {usePanesData} from "../tools/detector";

interface FormState {
  layout: 'local' | 'online';
  name: string;
}

const formState: UnwrapRef<FormState> = reactive({
  layout: 'local',
  name: ''
});

const columns = [
  {
    name: 'Name',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
  },
  {
    title: 'Action',
    key: 'action',
    width: 96,
  },
];

const data = [
  {
    key: '1',
    name: '这是一个归档的名字啊这是一个归档的名字啊这是一个归档的名字啊这是一个归档的名字啊',
    time: '01/03 18:12',
  },
  {
    key: '1',
    name: '这是一个归档的名字啊这是一个归档的名字啊这是一个归档的名字啊这是一个归档的名字啊',
    time: '01/03 18:12',
  },
  {
    key: '1',
    name: '这是一个归档的名字啊这是一个归档的名字啊这是一个归档的名字啊这是一个归档的名字啊',
    time: '01/03 18:12',
  },
];

const addArchive = () => {
  debugger
  const {addArchiveLocalDirData} = useArchiveLocalDirData();
  var panesData = JSON.stringify(usePanesData());
  addArchiveLocalDirData(formState.name, panesData)
}
</script>

<template>
  <div>
    <a-form layout="inline" :model="formState">
      <!--      <a-form-item label="">-->
      <!--        <a-radio-group v-model:value="formState.layout">-->
      <!--          <a-radio-button value="online">云端</a-radio-button>-->
      <!--          <a-radio-button value="local">本地</a-radio-button>-->
      <!--        </a-radio-group>-->
      <!--      </a-form-item>-->
      <a-form-item label="">
        <a-input v-model:value="formState.name" style="width: 220px;margin-left: 22px" placeholder="请输入归档名"/>
      </a-form-item>
      <a-form-item>
        <a-button type="default" @click="addArchive">新建归档</a-button>
      </a-form-item>
    </a-form>

    <div v-show="formState.layout=='local'">
      <a-divider style="margin-top: 14px" :plain="true"></a-divider>

      <a-table :columns="columns" :show-header="false" :data-source="data"
               :pagination="{hideOnSinglePage:true}">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            {{ record.name }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small">恢复</a-button>
            <a-button type="link" size="small">打开</a-button>
          </template>
        </template>
      </a-table>
    </div>


    <!--    <div v-show="formState.layout=='online'">-->
    <!--      <a-divider style="margin-top: 14px" :plain="true">目前仅可保存五个云端存档</a-divider>-->

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
  </div>
</template>

<style scoped>

</style>
