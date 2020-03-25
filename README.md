
## brasovair
This is a collection of tools for monitoring the air around Brasov area.
It is based on collecting data from uRADMonitor sensors and displaying real-time data along with vrious statistics for PM (2.5, 10) values.

Please link to the github project if you plan on using some of the source code.

### building the project
- install Open Layers
```sh
npm install ol --save
```
- Install react
```sh
npm install react --save
```
- instal Material UI
```sh
npm install proj4 @material-ui/core --save
```
 - crearte react app
```sh
npx create-react-app brasovair
```
 - start the dev server in brasovair folder
```sh
npm start
```
 - open localhost:3000
 - open vscode and add this configuration in launch.json
    ```sh
    "configurations": [
        {
            "type": "chrome",
            "request": "attach",
            "name": "Attach to Chrome",
            "url": "http://localhost:3000",
            "port": 9222,
            "webRoot": "${workspaceFolder}",
            "sourceMapPathOverrides": {
                "../*": "${webRoot}/*"
            }
        }

- now run vscode and attach to Chrome for debugging

!! ensure you run Chrome with debug port opened: 9222


