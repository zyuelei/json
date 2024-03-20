let fs;
toolsFun(() => {
    fs = require('fs')
})

window.copyContent = (text) => {
    toolsFun(() => {
        utools.copyText(text)
    }, () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(function () {
                })
                .catch(function (error) {
                });
        }
    })
}
window.getClipboardContent = (callback, errCallback) => {
    if (navigator.clipboard) {
        navigator.clipboard.readText()
            .then(text => callback(text))
            .catch(error => errCallback(error));
    } else {
        errCallback('当前浏览器不支持Clipboard API');
    }
}

window.onPluginEnter = (callback) => {
    toolsFun(() => {
        utools.onPluginEnter((option) => {
            callback && callback(option)
        })
    }, () => {
        setTimeout(() => {
            callback && callback({payload: '', type: 'string', code: 'json_format'})
        });
    })
}

window.isDark = () => {
    return toolsFun(() => {
        return utools.isDarkColors()
    }, () => {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
    })
}

function toolsFun(callback, errCallback) {
    if (typeof utools != 'undefined') {
        return callback();
    } else {
        return errCallback && errCallback()
    }
}

window.isMacOS = () => {
    return toolsFun(() => {
        return utools.isMacOS()
    }, () => {
        return getOperatingSystem() === 'MacOs'
    })
}

window.setContent = (key, value) => {
    return toolsFun(() => {
        utools.dbStorage.setItem(key, value)
    }, () => {
        localStorage.setItem(key, JSON.stringify(value));
    })
}

window.getContent = (key) => {
    return toolsFun(() => {
        return utools.dbStorage.getItem(key)
    }, () => {
        const val = localStorage.getItem(key);
        try {
            return JSON.parse(val);
        } catch (e) {
            return val
        }
    })
}

window.removeContent = (key) => {
    return toolsFun(() => {
        utools.dbStorage.removeItem(key)
    }, () => {
        localStorage.removeItem(key);
    })
}

window.allContent = (prefix) => {
    return toolsFun(() => {
        return utools.db.allDocs(prefix)
    }, () => {
        const matchingData = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!prefix || key.startsWith(prefix)) {
                const value = localStorage.getItem(key);
                matchingData.push({
                    _id: key,
                    value: JSON.parse(value)
                });
            }
        }

        return matchingData;
    })
}

function getOperatingSystem() {
    var os = "Unknown OS";
    if (navigator.appVersion.indexOf("Win") !== -1) os = "Windows";
    if (navigator.appVersion.indexOf("Mac") !== -1) os = "MacOs";
    if (navigator.appVersion.indexOf("X11") !== -1) os = "UNIX";
    if (navigator.appVersion.indexOf("Linux") !== -1) os = "Linux";
    return os;
}

window.readFile = function (path, callback) {
    return toolsFun(() => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                callback && callback(false, '');
                return
            }
            callback && callback(true, data); // 打印文件列表
        });
    }, () => {
        callback && callback(false, '');
    })
}
window.readDirList = function (path, callback) {
    return toolsFun(() => {
        fs.readdir(path, (err, files) => {
            if (err) {
                callback && callback(false, []);
                return
            }
            callback && callback(true, files); // 打印文件列表
        });
    }, () => {
        callback && callback(false, []);
    })
}
window.mkdir = function (path, callback) {
    return toolsFun(() => {
        fs.mkdir(path, {recursive: true}, (err) => {
            if (err) {
                callback && callback(false);
                return
            }
            callback && callback(true)
        });
    }, () => {
        callback && callback(false);
    })
}
window.addFile = function (path, content, callback, isAppend) {
    return toolsFun(() => {
        if (isAppend) {
            fs.appendFile(path, content, (err) => {
                if (err) {
                    callback && callback(false);
                    return
                }
                callback && callback(true)
            });
        } else {
            fs.writeFile(path, content, (err) => {
                if (err) {
                    callback && callback(false);
                    return
                }
                callback && callback(true)
            });
        }
    }, () => {
        callback && callback(false);
    })
}

window.unlinkFile = (path, callback) => {
    toolsFun(() => {
        fs.unlink(path, (err) => {
            if (err) {
                callback && callback(false);
                return
            }
            callback && callback(true)
        });
    })
}

window.getNativeId = function () {
    return toolsFun(() => {
        return utools.getNativeId()
    }, () => {
        return '';
    })
}


window.getPath = function (name) {
    return toolsFun(() => {
        return utools.getPath(name)
    }, () => {
        return '';
    })
}

window.isDir = function (path, callback) {
    return toolsFun(() => {
        return fs.stat(path, (err, stats) => {
            if (err) {
                callback && callback(false)
                return;
            }

            if (stats.isDirectory()) {
                callback && callback(true)
            } else {
                callback && callback(false)
            }
        });
    }, () => {
        callback(false)
    })
}

window.showOpenDialog = function () {
    return toolsFun(() => {
        return utools.showOpenDialog({
            defaultPath: getPath('documents'),
            properties: ['openDirectory', 'createDirectory']
        }, () => {
            return ''
        })
    })
}