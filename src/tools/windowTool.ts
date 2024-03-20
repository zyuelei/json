export function windowCopy(text: string) {
    // @ts-ignore
    window.copyContent && window.copyContent(text)
}

export function windowGetClipboardContent(then: any) {
    // @ts-ignore
    window.getClipboardContent && window.getClipboardContent((text: string) => {
        then(text)
    }, () => {
    })
}

export function windowIsMac(): boolean {
    // @ts-ignore
    return window.isMacOS && window.isMacOS()
}

export function windowPluginEnter(callback: (param: { payload: string, type: string, code: string }) => void) {
    // @ts-ignore
    window.onPluginEnter && window.onPluginEnter(({payload, type, code}: any) => {
        callback({payload, type, code})
    });
}

export function windowPluginReady(callback: any) {
    // @ts-ignore
    if (typeof utools != 'undefined') {
        // @ts-ignore
        utools.onPluginReady(() => {
            callback();
        })
    } else {
        callback();
    }
}

export function windowIsDark() {
    // @ts-ignore
    return window.isDark && window.isDark()
}

export function windowSetContent(key: string, value: any) {
    // @ts-ignore
    return window.setContent && window.setContent(key, value)
}

export function windowGetContent(key: string) {
    // @ts-ignore
    return window.getContent && window.getContent(key)
}

export function windowRemoveContent(key: string) {
    // @ts-ignore
    return window.removeContent && window.removeContent(key)
}

export function windowAllContent(prefix?: string) {
    // @ts-ignore
    return window.allContent && window.allContent(prefix)
}

export function windowReadFile(path: string, callback?: (status: boolean, value: string) => void) {
    // @ts-ignore
    return window.readFile && window.readFile(path, callback)
}

export function windowReadDirList(path: string, callback?: (status: boolean, value: string[]) => void) {
    // @ts-ignore
    return window.readDirList && window.readDirList(path, callback)
}

export function windowMkdir(path: string, callback?: (status: boolean) => void) {
    // @ts-ignore
    return window.mkdir && window.mkdir(path, callback)
}

export function windowAddFile(path: string, content: string, callback?: (status: boolean) => void, isAppend ?: boolean) {
    // @ts-ignore
    return window.addFile && window.addFile(path, content, callback, isAppend)
}

export function windowUnlinkFile(path: string, callback?: (status: boolean) => void) {
    // @ts-ignore
    return window.unlinkFile && window.unlinkFile(path, callback)
}

export function windowGetNativeId(): string {
    // @ts-ignore
    return window.getNativeId && window.getNativeId()
}

export function windowGetPath(name: 'home' | 'appData' | 'userData' | 'temp' | 'exe' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'logs'): string {
    // @ts-ignore
    return window.getPath && window.getPath(name)
}

export function windowIsDir(path: string, callback?: (status: boolean) => void) {
    // @ts-ignore
    return window.isDir && window.isDir(path, callback)
}

export function windowShowOpenDialog(): string {
    // @ts-ignore
    return window.showOpenDialog && window.showOpenDialog()
}

export function windowReplace(str: string) {
    const specialChars = /[:\\\/|?*"<>]/g;
    return str.replace(specialChars, '_');
}

export function windowValidStr(str: string) {
    const specialChars = /[:\\\/|?*"<>']/g;
    return specialChars.test(str)
}

