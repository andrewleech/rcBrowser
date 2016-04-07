import json
import time
from websocket import create_connection

ws = create_connection("ws://localhost:39682")

ws.send(json.dumps({'fn': 'show', 'arg': None}))

ws.send(json.dumps({'fn': 'loadURL', 'arg': 'https://www.alelec.net'}))

result = True
while result is not None:
    try:
        result =  ws.recv()
        print result

        jmsg = json.loads(result)
        fn = jmsg['fn']
        arg = jmsg['arg']

        if fn == 'keyDown':
            if str(arg) == str(27):  # Esc
                ws.send(json.dumps({'fn': 'hide', 'arg': None}))
                time.sleep(5)
                ws.send(json.dumps({'fn': 'show', 'arg': None}))
            else:
                harg = hex(arg)[2:]
                harg = r"\u" + "0"*(4-len(harg)) + harg
                ws.send(json.dumps({'fn': 'keyDown', 'arg': harg}))

    except Exception as ex:
        pass

ws.close()
