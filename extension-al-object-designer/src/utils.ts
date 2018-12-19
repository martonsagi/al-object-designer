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

// (c) 2007 Steven Levithan <stevenlevithan.com>
// MIT License

/*** matchRecursive
	accepts a string to search and a format (start and end tokens separated by "...").
	returns an array of matches, allowing nested instances of format.

	examples:
		matchRecursive("test",          "(...)")   -> []
		matchRecursive("(t(e)s)()t",    "(...)")   -> ["t(e)s", ""]
		matchRecursive("t<e>>st",       "<...>")   -> ["e"]
		matchRecursive("t<<e>st",       "<...>")   -> ["e"]
		matchRecursive("t<<e>>st",      "<...>")   -> ["<e>"]
		matchRecursive("<|t<e<|s|>t|>", "<|...|>") -> ["t<e<|s|>t"]
*/
export function matchRecursive() {
    var formatParts = /^([\S\s]+?)\.\.\.([\S\s]+)/,
        metaChar = /[-[\]{}()*+?.\\^$|,]/g,
        escape = function (str: string) {
            return str.replace(metaChar, "\\$&");
        };

    return function (str: string, format: any) {
        var p = formatParts.exec(format);
        if (!p) throw new Error("format must include start and end tokens separated by '...'");
        if (p[1] == p[2]) throw new Error("start and end format tokens cannot be identical");

        var opener = p[1],
            closer = p[2],
            /* Use an optimized regex when opener and closer are one character each */
            iterator = new RegExp(format.length == 5 ? "[" + escape(opener + closer) + "]" : escape(opener) + "|" + escape(closer), "g"),
            results = [],
            openTokens, matchStartIndex, match;

        do {
            openTokens = 0;
            while (match = iterator.exec(str)) {
                if (match[0] == opener) {
                    if (!openTokens)
                        matchStartIndex = iterator.lastIndex;
                    openTokens++;
                } else if (openTokens) {
                    openTokens--;
                    if (!openTokens)
                        results.push(str.slice(matchStartIndex, match.index));
                }
            }
        } while (openTokens && ((iterator.lastIndex as any) = matchStartIndex));

        return results;
    };
};

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
    });
}
