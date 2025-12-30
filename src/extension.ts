import * as vscode from 'vscode';
import { parseImports } from './parser';
import { getPackageSize } from './fetcher';
import { renderDecorations } from './decorator';

let activeEditor = vscode.window.activeTextEditor;

export function activate(context: vscode.ExtensionContext) {
    console.log('Size-Cost-Import is active! :3');

    if (activeEditor) {
        triggerUpdate();
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) triggerUpdate();
    }, null, context.subscriptions);

    let timeout: NodeJS.Timeout | undefined = undefined;
    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(triggerUpdate, 1000);
        }
    }, null, context.subscriptions);
}

async function triggerUpdate() {
    if (!activeEditor) return;

    const text = activeEditor.document.getText();
    const imports = parseImports(text);
    const results = [];

    for (const imp of imports) {
        const size = await getPackageSize(imp.pkgName);
        if (size !== 'Unknown' && size !== 'Error') {
            results.push({ line: imp.lineIndex, size: size });
        }
    }

    renderDecorations(activeEditor, results);
}

export function deactivate() { }
