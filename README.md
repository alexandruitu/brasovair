# brasovair
This is a collection of tools for monitoring the air around Brasov area.
It is based on collecting data from uRADMonitor sensors and displaying real-time data along with vrious statistics for PM (2.5, 10) values.

Please link to the github project if you plan on using some of the source code.

# building teh project
1 - install Open Layers
npm install ol --save
2- Install react
npm install react --save
3 - instal Material UI
npm install proj4 @material-ui/core --save
4 - crearte react app
npx create-react-app brasovair
5 - start the dev server in brasovair folder
npm start
6 - open localhost:3000
7 - open vscode and add this configuration in launch.json
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

8 - runs vscode and attach to Chrome for debugging

!! ensure you run Chrome with debug port opened: 9222
