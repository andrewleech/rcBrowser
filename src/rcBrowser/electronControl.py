import json
from websocket import create_connection

ws = create_connection("ws://localhost:39682")

ws.send(json.dumps({'fn': 'show', 'arg': None}))

ws.send(json.dumps({'fn': 'loadURL', 'arg': 'https://www.alelec.net'}))

result =  ws.recv()
print "Received '%s'" % result
ws.close()
