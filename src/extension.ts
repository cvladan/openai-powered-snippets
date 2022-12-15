import * as vscode from 'vscode';
import Variable from './core/variable';
import getCommandRunnerContext, { CommandRunnerContext } from './core/command-runner-context';
import { setOpenAIApiKey } from './core/openai-client';
import GenericWebViewPanel from './vscode-functions/webview-panel';
import importSnippets from './core/importSnippets';
import getSelectedText from './vscode-functions/get-selected-text';
import getBaseFolder from './vscode-functions/get-base-folder';

export let commandRunnerContext: CommandRunnerContext;

export function activate(context: vscode.ExtensionContext) {
	commandRunnerContext = getCommandRunnerContext();

	if (vscode.window.registerWebviewPanelSerializer) {
		vscode.window.registerWebviewPanelSerializer(GenericWebViewPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {/*TODO! ??*/ }
		});
	}

	initConfiguration();
	//TODO: make baseFolder lazy
	commandRunnerContext.setSystemVariable(new Variable("baseFolder", getBaseFolder()));
	importSnippets();
	initVsCodeCommands(context);
	initEvents();
}
function initEvents() {
	vscode.window.onDidChangeActiveTextEditor((e) => {
		if (!e) {
			return;
		}
		//TODO: make lazy
		commandRunnerContext.setSystemVariable(new Variable("fileName", e.document.fileName));
	});

	vscode.window.onDidChangeTextEditorSelection(async (e) => {
		if (!e) {
			return;
		}
		//TODO: make lazy
		commandRunnerContext.setSystemVariable(new Variable("selection", getSelectedText()));
	});

}
function initVsCodeCommands(context: vscode.ExtensionContext) {
	const commandExplain = vscode.commands.registerCommand('openaipoweredsnip.run', async () => {

		commandRunnerContext.setSystemVariable(new Variable("extensionUri", context.extensionUri));

		let selectedCommand = await vscode.window.showQuickPick(commandRunnerContext.getCommands().map(c => ({
			label: c.name,
			description: c.description,
			command: c
		})));
		if (selectedCommand) {
			await commandRunnerContext.runCommand(selectedCommand?.command);
		}
	});
	context.subscriptions.push(commandExplain);

}
export let extensionConfig: { [key: string]: string | undefined; } = {};
function initConfiguration() {

	const config = vscode.workspace.getConfiguration('openaipoweredsnip');
	setOpenAIApiKey(config.get('openAIToken'));

	vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
		if (event.affectsConfiguration('"openaipoweredsnip.openAIToken')) {
			const config = vscode.workspace.getConfiguration('openaipoweredsnip');
			setOpenAIApiKey(config.get('openAIToken') as string | undefined);

		} else if (event.affectsConfiguration('openaipoweredsnip.snippetFiles')) {
			const config = vscode.workspace.getConfiguration('openaipoweredsnip');
			extensionConfig['snipFiles'] = config.get('snippetFiles');
			importSnippets();
		}
	});
}


export function deactivate() { }
