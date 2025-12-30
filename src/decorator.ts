import * as vscode from 'vscode';

const smallSizeDecoration = vscode.window.createTextEditorDecorationType({
    after: { margin: '0 0 0 1rem', color: '#4caf50' }
});
const mediumSizeDecoration = vscode.window.createTextEditorDecorationType({
    after: { margin: '0 0 0 1rem', color: '#ff9800' }
});
const largeSizeDecoration = vscode.window.createTextEditorDecorationType({
    after: { margin: '0 0 0 1rem', color: '#f44336' }
});

export function renderDecorations(editor: vscode.TextEditor, data: { line: number, size: string }[]) {
    const small: vscode.DecorationOptions[] = [];
    const medium: vscode.DecorationOptions[] = [];
    const large: vscode.DecorationOptions[] = [];

    data.forEach(item => {
        const sizeNum = parseFloat(item.size);

        const decoration = {
            range: new vscode.Range(item.line, 1000, item.line, 1000),
            renderOptions: { after: { contentText: ` 📦 ${item.size}` } }
        };

        if (sizeNum > 50) large.push(decoration);
        else if (sizeNum > 10) medium.push(decoration);
        else small.push(decoration);
    });

    editor.setDecorations(smallSizeDecoration, small);
    editor.setDecorations(mediumSizeDecoration, medium);
    editor.setDecorations(largeSizeDecoration, large);
}
