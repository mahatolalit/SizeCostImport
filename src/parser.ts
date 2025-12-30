export interface ImportData {
    pkgName: string;
    lineIndex: number;
}

export function parseImports(text: string): ImportData[] {
    const imports: ImportData[] = [];
    const lines = text.split('\n');

    const regex = /(?:import\s+.*?from\s+['"]|require\(['"])([^./][^'"]*)['"]/;

    lines.forEach((line, index) => {
        const match = line.match(regex);
        if (match && match[1]) {
            imports.push({
                pkgName: match[1],
                lineIndex: index
            });
        }
    });

    return imports;
}
