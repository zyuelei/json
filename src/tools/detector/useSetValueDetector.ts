import {computed, Ref, ref, toRaw} from "vue";
import {panesInterface} from "../../interface";
import {useDataOperateDetector} from "./useDataOperateDetector";
import dayjs from "dayjs";
import {useSetConfigDetector} from "./useSetConfigDetector";

interface UseDoubleShiftDetectorParams {
    activeKey: Ref<number>,
}

export function useSetValueDetector({
                                        activeKey,
                                    }: UseDoubleShiftDetectorParams) {

    const {getConfig} = useSetConfigDetector({
        onConfigChange: (key, value) => {
            if (key == 'saveData' && value) {
                panes.value.map((value, index) => saveData(toRaw(value), index))
            }
        }
    })
    const _defaultPanesValue: panesInterface = {
        title: 'temp',
        key: 0,
        closable: false,
        favorite: true,
        content: '',
        time: 0,
        render: getConfig('render'),
        init: true
    };

    const {saveData, loadData, removeData} = useDataOperateDetector({
        onLoadData: function (data: panesInterface) {
            if (!data) {
                return false;
            }
            if (!checkDataExists(data)) {
                return true
            }
            data.init = false;
            panes.value.push(data)
            return true;
        }
    })
    const panes = ref<panesInterface[]>([_defaultPanesValue]);
    const activeIndex = computed(() => {
        return panes.value.findIndex(obj => obj.key === activeKey.value)
    })

    const activeData = computed(() => {
        return panes.value[activeIndex.value]
    })

    function checkDataExists(data: panesInterface) {
        return panes.value.filter(value => value.key == data.key).length <= 0;
    }

    const deleteData = (targetKey: number) => {
        let lastIndex = 0;
        panes.value.forEach((pane, i) => {
            if (pane.key === targetKey) {
                lastIndex = i - 1;
            }
        });
        panes.value = panes.value.filter(pane => pane.key !== targetKey);
        removeData(targetKey)
        if (panes.value.length && activeKey.value === targetKey) {
            if (lastIndex >= 0) {
                activeKey.value = panes.value[lastIndex].key;
            } else {
                activeKey.value = panes.value[0].key;
            }
        }
    }

    const addData = (nowTime: number) => {
        panes.value.push({
            title: dayjs(nowTime).format('HH:mm:ss'),
            key: nowTime,
            content: '',
            init: true,
            time: nowTime,
            render: getConfig('render')
        });
    }

    const tabOperate = (type: string) => {
        switch (type) {
            case 'closeLeft':
                panes.value.map((value: any) => {
                    if (value.key < activeKey.value && value.favorite !== true && value.key > 0) {
                        deleteData(value.key)
                    }
                })
                break;
            case 'closeRight':
                panes.value.map((value: any) => {
                    if (value.key > activeKey.value && value.favorite !== true && value.key > 0) {
                        deleteData(value.key)
                    }
                })
                break;
            case 'closeOther':
                panes.value.map((value: any) => {
                    if (value.key != activeKey.value && value.favorite !== true && value.key > 0) {
                        deleteData(value.key)
                    }
                })
                break;
            case 'closeAll':
                panes.value.map((value: any) => {
                    if (value.key > 0 && value.favorite !== true) {
                        deleteData(value.key)
                    }
                })
                break;
            case 'forceCloseAll':
                panes.value.map((value: any) => {
                    if (value.key > 0) {
                        deleteData(value.key)
                    }
                })
                break;
        }
    }

    const setSaveValue = <T extends keyof panesInterface>(key: T, value: panesInterface[T]) => {
        activeData.value[key] = value
        saveData(toRaw(activeData.value), activeIndex.value)
    }

    const calcNextKey = (order: boolean) => {
        let nextKey;
        if (!order) {
            nextKey = activeIndex.value - 1;
            if (nextKey < 0) nextKey = panes.value.length - 1;
        } else {
            nextKey = activeIndex.value + 1;
            if (nextKey >= panes.value.length) nextKey = 0;
        }
        return panes.value[nextKey].key;
    }

    return {panesData: panes, activeIndex, activeData, loadData, addData, deleteData, tabOperate, calcNextKey, setSaveValue};
}
