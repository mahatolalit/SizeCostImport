import * as https from 'https';
import * as vscode from 'vscode';

const sizeCache: { [key: string]: string } = {};
let packageJsonCache: { dependencies?: { [key: string]: string }, devDependencies?: { [key: string]: string } } | null = null;
let lastPackageJsonRead = 0;

async function getInstalledVersion(pkgName: string): Promise<string | null> {
    const now = Date.now();

    if (!packageJsonCache || (now - lastPackageJsonRead > 10000)) {
        const files = await vscode.workspace.findFiles('package.json', '**/node_modules/**', 1);
        if (files.length > 0) {
            try {
                const doc = await vscode.workspace.openTextDocument(files[0]);
                packageJsonCache = JSON.parse(doc.getText());
                lastPackageJsonRead = now;
            } catch (e) {

            }
        }
    }

    if (packageJsonCache) {
        if (packageJsonCache.dependencies && packageJsonCache.dependencies[pkgName]) {
            return packageJsonCache.dependencies[pkgName];
        }
        if (packageJsonCache.devDependencies && packageJsonCache.devDependencies[pkgName]) {
            return packageJsonCache.devDependencies[pkgName];
        }
    }
    return null;
}

const MAX_CONCURRENT_REQUESTS = 3;
let activeRequests = 0;
const requestQueue: (() => void)[] = [];

function processQueue() {
    if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
        return;
    }

    const nextRequest = requestQueue.shift();
    if (nextRequest) {
        activeRequests++;
        nextRequest();
    }
}

export function getPackageSize(pkgName: string): Promise<string> {
    return new Promise(async (resolve) => {
        let version = await getInstalledVersion(pkgName);
        let queryName = pkgName;

        if (version) {
            const cleanVersion = version.replace(/[\^~>=<]/g, '');
            if (cleanVersion.match(/^\d+\.\d+\.\d+/)) {
                queryName = `${pkgName}@${cleanVersion}`;
            }
        }

        if (sizeCache[queryName]) {
            resolve(sizeCache[queryName]);
            return;
        }

        const runRequest = () => {
            const url = `https://bundlephobia.com/api/size?package=${queryName}`;

            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    activeRequests--;
                    processQueue();
                    try {
                        const json = JSON.parse(data);
                        const size = (json.gzip / 1024).toFixed(1) + ' KB';
                        sizeCache[queryName] = size;
                        resolve(size);
                    } catch (e) {
                        resolve('Unknown');
                    }
                });
            }).on('error', () => {
                activeRequests--;
                processQueue();
                resolve('Error');
            });
        };

        requestQueue.push(runRequest);
        processQueue();
    });
}
