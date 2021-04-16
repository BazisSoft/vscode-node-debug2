# VS Code Bazis Debug 2

This repository contains the debug extension for [Bazis-Woodworker 2021](http://bazissoft.ru/products/bazis_mebelschik) scripts that can be debugged via [VS Code](https://code.visualstudio.com).

This extension is based on [`vscode-node-debug2`](https://github.com/microsoft/vscode-node-debug2) extension.

## Создание конфигурации запуска
Для создания конфигурации запуска перейдите во вкладку "Отладка" и выберите "Создать файл launch.json".
В предложенном списке сред отладки выберите "Bazis 2021".
![DebuggerInstall](https://user-images.githubusercontent.com/9331480/114889062-72597f80-9e12-11eb-94ca-996385e6c775.gif)

Для добавления конфигурации запуска в уже существующий файл launch.json откройте его и выберите "Добавить конфигурацию"->"Bazis 2021"
![DebuggerInstall2](https://user-images.githubusercontent.com/9331480/114889923-3d99f800-9e13-11eb-9069-f0c05d3bf1e3.gif)

## License

Copyright (c) Microsoft Corporation. All rights reserved.

Licensed under the [MIT](LICENSE.txt) License.
