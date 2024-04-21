import requests
headers = {"X-User-id": "", "X-User-hash":""}
response = requests.get('https://data.uradmonitor.com/api/v1/devices',headers = headers)
print(response.content)
