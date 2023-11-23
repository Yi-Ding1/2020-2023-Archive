import PySimpleGUI as sg
from math import sqrt

layout = [
    [sg.Text("Enter a value to find the sqrt of.")],
    [sg.InputText(key="num")],
    [sg.Text('',size=(10,1),key="result")],
    [sg.Button("Calculate",bind_return_key=True), sg.Button("Close")]
]

cal_window = sg.Window("Mini Calculator", layout)

while True:
    event, values = cal_window.read()
    if event in (None,"Close"):
        print("The user pressed", event)
        break
    elif event in ("Calculate"):
        num = float(values["num"])
        result = round(sqrt(num),5)
        cal_window.find_element("result").update(result)
    else:
        print("An error occurred.")