import * as https from 'https';

const sizeCache: { [key: string]: string } = {};

export function getPackageSize(pkgName: string): Promise<string> {
    return new Promise((resolve) => {
        if (sizeCache[pkgName]) {
            resolve(sizeCache[pkgName]);
            return;
        }

        const url = `https://bundlephobia.com/api/size?package=${pkgName}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const size = (json.gzip / 1024).toFixed(1) + ' KB';
                    sizeCache[pkgName] = size;
                    resolve(size);
                } catch (e) {
                    resolve('Unknown');
                }
            });
        }).on('error', () => resolve('Error'));
    });
}
