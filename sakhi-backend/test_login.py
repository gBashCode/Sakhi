import urllib.request, json

url = "http://127.0.0.1:8000/api/v1/auth/login"
data = json.dumps({"phone": "9999999999", "pin": "1234"}).encode()
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
try:
    with urllib.request.urlopen(req) as resp:
        print("STATUS:", resp.status)
        print("BODY:", resp.read().decode())
except Exception as e:
    print("ERROR:", e)
    import urllib.error
    if hasattr(e, 'read'):
        print("DETAIL:", e.read().decode())
