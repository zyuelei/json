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

export function windowPluginEnter(callback: any) {
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