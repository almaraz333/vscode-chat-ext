import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {
	console.log("Custom chat extension now active!");

	const disposable = vscode.commands.registerCommand('colton-chat-ext.hiMom', () => {
		const panel = vscode.window.createWebviewPanel(
			'deepChat',
			'Deep Seek Chat',
			vscode.ViewColumn.One,
			{enableScripts: true}
		);

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command === 'chat') {
				const userPrompt = message.text;
				let res = '';

				try {
					const streamRes = await ollama.chat({
						model: 'deepseek-r1:32b',
						messages: [{role: 'user', content: userPrompt}],
						stream: true
					});

					panel.webview.postMessage({command: "streamingIn"});

					for await (const part of streamRes) {
						res += part.message.content;
						panel.webview.postMessage({command: "chatResponse", text: res});
					}
				} catch(e) {
					panel.webview.postMessage({command: "chatResponse", text: `Error: ${String(e)}`});
				}
			}
		});
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
	return /*html*/`
		<!DOCTYPE html>
		<html lang="en">
		<head>
		<meta charset="UTF-8"/>
		<style>
			body {font-family: sans-serif; margin 1rem;}
			#prompt {width 100%; box-sizing: border-box;}
			#response {border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem;}
		</style>
		</head>
		<body>
		<h2>Deepseek VS Code Extension</h2>
		<textarea id="prompt" rows="3" placeholder="Ask something..."></textarea><br/>
		<button id="askBtn">Ask</button>
		<div id="response"></div>

		<script>
			const vscode = acquireVsCodeApi()

			document.getElementById('askBtn').addEventListener('click', () => {
				const text = document.getElementById('prompt').value;
				vscode.postMessage({command: 'chat', text})
				document.getElementById('response').innerText = "Loading..."
			})

			window.addEventListener("message", (e) => {
				const {command, text} = e.data;

				if (command === "chatResponse") {
					document.getElementById('response').innerText = text
				} else if (command === "streamingIn") {
					document.getElementById('response').innerText = ""
				}
			})

		</script>
		</body>
		</html>
	`;
}

export function deactivate() {}