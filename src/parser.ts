import {
    createSourceFile,
    ScriptTarget,
    Node,
    isImportDeclaration,
    isStringLiteral,
    isImportEqualsDeclaration,
    isExternalModuleReference,
    isCallExpression,
    isIdentifier,
    forEachChild
} from 'typescript';

export interface ImportData {
    pkgName: string;
    lineIndex: number;
}

export function parseImports(text: string): ImportData[] {
    const imports: ImportData[] = [];
    const sourceFile = createSourceFile('temp.ts', text, ScriptTarget.Latest, true);

    function visit(node: Node) {
        // Handle: import ... from 'package'
        if (isImportDeclaration(node)) {
            if (node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
                addImport(node.moduleSpecifier.text, node.getStart());
            }
        }
        // Handle: import x = require('package')
        else if (isImportEqualsDeclaration(node)) {
            if (node.moduleReference && isExternalModuleReference(node.moduleReference) && isStringLiteral(node.moduleReference.expression)) {
                addImport(node.moduleReference.expression.text, node.getStart());
            }
        }
        // Handle: require('package') 
        else if (isCallExpression(node)) {
            if (isIdentifier(node.expression) && node.expression.text === 'require' && node.arguments.length > 0) {
                const arg = node.arguments[0];
                if (isStringLiteral(arg)) {
                    addImport(arg.text, node.getStart());
                }
            }
        }

        forEachChild(node, visit);
    }

    function addImport(pkgName: string, pos: number) {
        if (!pkgName.startsWith('.') && !pkgName.startsWith('/')) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(pos);
            imports.push({ pkgName, lineIndex: line });
        }
    }

    visit(sourceFile);
    return imports;
}
