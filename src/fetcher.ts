import * as https from 'https';

const sizeCache: { [key: string]: string } = {};

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
    return new Promise((resolve) => {
        if (sizeCache[pkgName]) {
            resolve(sizeCache[pkgName]);
            return;
        }

        const runRequest = () => {
            const url = `https://bundlephobia.com/api/size?package=${pkgName}`;

            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    activeRequests--;
                    processQueue();
                    try {
                        const json = JSON.parse(data);
                        const size = (json.gzip / 1024).toFixed(1) + ' KB';
                        sizeCache[pkgName] = size;
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
