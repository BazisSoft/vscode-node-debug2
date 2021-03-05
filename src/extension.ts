/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';

import * as Core from 'vscode-chrome-debug-core';

function ShowDTSDownloadSuccess(){
    vscode.window.showInformationMessage('Declaration download success');
}

function ShowDTSDownloadError(err){
    vscode.window.showErrorMessage('Declaration download error.', err);
}

function addDeclarationFiles() {
    const loadPath = 'https://raw.githubusercontent.com/BazisSoft/Scripts/master/node_modules/%40types/bazis/index.d.ts';
    //create directories
    //TODO: find better way, if it exists
    let declPath = path.join(vscode.workspace.rootPath, '/node_modules');
    if (!fs.existsSync(declPath)){
        fs.mkdirSync(declPath);
    };
    declPath = path.join(declPath, '/@types');
    if (!fs.existsSync(declPath)){
        fs.mkdirSync(declPath);
    };
    declPath = path.join(declPath, '/bazis');
    if (!fs.existsSync(declPath)){
        fs.mkdirSync(declPath);
    };
    const fileName = path.join(declPath, 'index.d.ts');
    var request = https.get(loadPath, function (response) {
        if (response.statusCode == 200){
            var file = fs.createWriteStream(fileName);
            response.pipe(file);
            file.on('finish', function () {
                file.close();
                ShowDTSDownloadSuccess();
            });
            request.on('error', err => {
            fs.unlink(fileName, () => ShowDTSDownloadError(err));
            });

            file.on('error', err => {
            fs.unlink(fileName, () => ShowDTSDownloadError(err));
            });
        }
        else{
            ShowDTSDownloadError(response.statusCode + ':' + response.statusMessage);
            file.close();
        }
    });
}

const initialConfigurations = [
    {
        name: 'Launch Program',
        type: 'bazis2',
        request: 'launch',
        program: '${file}'
    }
];

class ExtensionHostDebugConfigurationProvider implements vscode.DebugConfigurationProvider {

    public async provideDebugConfigurations(
        folder: vscode.WorkspaceFolder | undefined,
        token?: vscode.CancellationToken
    ): Promise<vscode.DebugConfiguration[] | undefined> {
        folder = folder || (vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined);
        let config;
        Object.assign(config, initialConfigurations);
        return [config as vscode.DebugConfiguration];
    }

    resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration): vscode.ProviderResult<vscode.DebugConfiguration> {
        // const useV3 = getWithoutDefault('debug.extensionHost.useV3') ?? getWithoutDefault('debug.javascript.usePreview') ?? true;

        // if (useV3) {
        //     folder = folder || (vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined);
        //     debugConfiguration['__workspaceFolder'] = folder?.uri.fsPath;
        //     debugConfiguration.type = 'pwa-extensionHost';
        // }
        //Object.assign(debugConfiguration, initialConfigurations);
        return debugConfiguration;
    }
}

function getProgram(): string {
    const packageJsonPath = path.join(vscode.workspace.rootPath, 'package.json');
    let program = '';

    // Get 'program' from package.json 'main' or 'npm start'
    try {
        const jsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        const jsonObject = JSON.parse(jsonContent);
        if (jsonObject.main) {
            program = jsonObject.main;
        } else if (jsonObject.scripts && typeof jsonObject.scripts.start === 'string') {
            program = (<string>jsonObject.scripts.start).split(' ').pop();
        }
    } catch (error) { }

    return program;
}

function provideInitialConfigurations(): string {
    let program = getProgram();

    if (program) {
        program = path.isAbsolute(program) ? program : path.join('${workspaceFolder}', program);
        initialConfigurations.forEach(config => {
            if (config['program']) {
                config['program'] = program;
            }
        });
    }

    // If this looks like a typescript/coffeescript workspace, add sourcemap-related props
    if (vscode.workspace.textDocuments.some(document => document.languageId === 'typescript' || document.languageId === 'coffeescript')) {
        initialConfigurations.forEach(config => {
            config['outFiles'] = [];
        });
    }

    // Massage the configuration string, add an aditional tab and comment out processId
    const configurationsMassaged = JSON.stringify(initialConfigurations, null, '\t').replace(',\n\t\t"processId', '\n\t\t//"processId')
        .split('\n').map(line => '\t' + line).join('\n').trim();

    return [
        '{',
        '\t// Use IntelliSense to find out which attributes exist for node debugging',
        '\t// Use hover for the description of the existing attributes',
        '\t// For further information visit https://go.microsoft.com/fwlink/?linkid=830387',
        '\t"version": "0.2.0",',
        '\t"configurations": ' + configurationsMassaged,
        '}'
    ].join('\n');
}

export function activate(context: vscode.ExtensionContext) {
	const debugConfigurationProvider = new ExtensionHostDebugConfigurationProvider();
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('Bazis 2021', debugConfigurationProvider));
    context.subscriptions.push(vscode.commands.registerCommand('extension.bazis-debug2.addDeclarationFiles', addDeclarationFiles));
    context.subscriptions.push(vscode.commands.registerCommand('extension.bazis-debug2.provideInitialConfigurations', provideInitialConfigurations));
    context.subscriptions.push(vscode.commands.registerCommand('extension.bazis-debug2.toggleSkippingFile', toggleSkippingFile));
}

export function deactivate() {
}

function toggleSkippingFile(path: string | number): void {
    if (!path) {
        const activeEditor = vscode.window.activeTextEditor;
        path = activeEditor && activeEditor.document.fileName;
    }

    if (path && vscode.debug.activeDebugSession) {
        const args: Core.IToggleSkipFileStatusArgs = typeof path === 'string' ? { path } : { sourceReference: path };
        vscode.debug.activeDebugSession.customRequest('toggleSkipFileStatus', args);
    }
}
