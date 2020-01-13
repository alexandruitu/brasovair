import requests
headers = {"X-User-id": "6278", "X-User-hash":"a235942bff158e1027d455a9d36d2fa3"}
response = requests.get('https://data.uradmonitor.com/api/v1/devices',headers = headers)
print(response.content)