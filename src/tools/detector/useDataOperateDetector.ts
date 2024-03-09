import {windowGetContent, windowRemoveContent, windowSetContent} from "../windowTool.ts";
import {panesInterface} from "../../interface";
import {ref} from "vue";


interface useDataOperateInterface {
    onLoadData: (data: panesInterface) => boolean
}

export function useDataOperateDetector({
                                           onLoadData
                                       }: useDataOperateInterface) {
    let saveList: number[] = [];
    const saveListKey = 'data_list';
    const saveDataKeyPrefix = 'data_content_';
    const toggleSwitch = ref<boolean>(false)

    function getSaveDataList(): number[] {
        if (saveList.length > 0) {
            return saveList;
        }
        const list = windowGetContent(saveListKey);
        saveList = !Array.isArray(list) || list.length == 0 ? [] : list;
        return saveList;
    }


    function setSaveDataList(list: number[]) {
        saveList = list;
        return windowSetContent(saveListKey, list)
    }

    function pushSaveDataList(data: number, index?: number) {
        let list = getSaveDataList();
        if (!list.includes(data)) {
            if (index === undefined) {
                list.push(data)
            } else {
                list.splice(index, 0, data)
            }
            setSaveDataList(list)
        }
    }

    function getSaveDataContent(active: Number): panesInterface {
        const saveDataKey = saveDataKeyPrefix + active;
        return windowGetContent(saveDataKey)
    }

    function removeData(key: number | number[]) {
        let removeKey: number[] = []
        if (typeof key === "number") {
            removeKey = [key]
        } else {
            removeKey = key
        }
        setSaveDataList(getSaveDataList().filter(item => !removeKey.includes(item)));
        removeKey.map((item) => {
            return windowRemoveContent(saveDataKeyPrefix + item)
        })
    }

    function loadData() {
        const list = getSaveDataList();
        let removeKey: number[] = [];
        list.map((key) => {
            const data = getSaveDataContent(key)
            const res = onLoadData(data)
            if (!res) {
                removeKey.push(key)
            }
        })
        if (removeKey) {
            removeData(removeKey)
        }
    }

    function saveData(data: panesInterface, index?: number) {
        if (!toggleSwitch.value) {
            return true;
        }
        setTimeout(() => {
            const saveDataKey = saveDataKeyPrefix + data.key;
            pushSaveDataList(data.key, index);
            windowSetContent(saveDataKey, data);
        })
    }

    return {saveData, loadData, removeData, toggleSwitch}
}