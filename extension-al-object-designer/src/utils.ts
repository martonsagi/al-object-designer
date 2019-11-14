import * as vscode from 'vscode';
const JSZip = require("jszip");
const fs = require('fs-extra');
const path = require('path');

export async function read(file: any) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, "utf8", (err: any, data: any) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

export async function write(file: any, content: any) {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, content, (err: any, data: any) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

export async function readDir(filePath: any) {
    return new Promise((resolve, reject) => {
        fs.readdir(filePath, "utf8", (err: any, data: any) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

export async function unlink(file: any) {
    return new Promise((resolve, reject) => {
        fs.unlink(file, (err: any) => {
            if (err) reject(err);
            else resolve();
        });
    });
}


export async function readZip(filePath: any) {
    return new Promise((res, rej) => {
        new JSZip.external.Promise(function (resolve: any, reject: any) {
            fs.readFile(filePath, function (err: any, data: any) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }).then(function (data: any) {
            return JSZip.loadAsync(data);
        }).then((d: any) => {
            res(d);
        }).catch((e: any) => rej(e));
    });
}

export function replaceAll(str: string, find: any, replace: any) {
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

export function toUpperCaseFirst(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function uniqBy(a: any, key: any) {
    var index: any = [];
    return a.filter(function (item: any) {
        var k = key(item);
        return index.indexOf(k) >= 0 ? false : index.push(k);
    });
}

export function getAllMatches(regex: RegExp, text: string) {
    if (regex.constructor !== RegExp) {
        throw new Error('not RegExp');
    }

    var res = [];
    var match = null;

    if (regex.global) {
        while (match = regex.exec(text)) {
            res.push(match);
        }
    }
    else {
        if (match = regex.exec(text)) {
            res.push(match);
        }
    }

    return res;
}

export async function folderExists(folder: any) {
    return new Promise((resolve, reject) => {
        fs.stat(folder, (err: any, stats: any) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true)
            }
        });
    });
}

export async function mkdir(folder: any) {
    return new Promise((resolve, reject) => {
        fs.mkdir(folder, (err: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(true)
            }
        });
    });
}

export async function copyFiles(source: any, destination: any) {
    return await fs.copy(source, destination);
}

export async function getFirstCodeLine(file: string) {
    return new Promise<string>((resolve, reject) => {
        let lineReader = require('readline').createInterface({
            input: require('fs').createReadStream(file),
        });

        lineReader.on('line', (fline: string) => {
            if (fline.length > 0 && fline[0] != '/') {
                resolve(fline);
                lineReader.close();
            }
        });

        lineReader.on('close', () => {
            resolve('');
        });
    });
}

export async function getObjectHeaders(filePath: string) {
    let fileContent: string = await read(filePath) as string;
    //let pattern = /([a-z]+)\s([0-9]+|.*?)\s?(.*)/gm;
    let pattern = /\b^(codeunit|page|pageextension|pagecustomization|dotnet|enum|enumextension|query|report|table|tableextension|xmlport|profile|controladdin)\s([0-9]+|.*?)\s?(.*)/gm;
    let matches = getAllMatches(pattern, fileContent);

    let result = matches.map(m => m[0]);

    return result;
}

export function insertString(inStr: string, index: number, str: string) {
    if (index > 0)
        return inStr.substring(0, index) + str + inStr.substring(index, inStr.length);
    else
        return str + inStr;
};

export function getVsConfig() {
    let result = vscode.workspace.getConfiguration('alObjectDesigner');
    return result;
}