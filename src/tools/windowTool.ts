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