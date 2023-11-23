import random
import PySimpleGUI as sg
import os
sg.theme('DarkAmber')
sg.SetOptions(font=('Calibri',12,'bold'))

#import images
dirname, filename = os.path.split(os.path.abspath(__file__))
background_home = os.path.join(dirname,'image/background.png')
background_win = os.path.join(dirname,'image/win.png')
background_lose = os.path.join(dirname,'image/lose.png')

#layout for home window
layout1 = [
    [sg.Image(background_home,background_color='LightBlue')],
    [sg.Button("New Game",size=(14,1),button_color=('white')),sg.Button("Exit",size=(14,1),button_color=('white', 'green'))]
]

#layout for input window
layout2 = [
    [sg.Text('Longest winstreak:'),sg.Text('',size=(10,1),key='lws'),sg.Text('Current winstreak:'),sg.Text('',size=(10,1),key='cws')],
    [sg.Text('',size=(30,1),key='dpTitle')],
    [sg.Text('',size=(30,1),key='dpWord')],
    [sg.Text('Letters that have been guessed:'),sg.Text('',size=(30,1),key='dpLetter')],
    [sg.Text("Enter a letter:  "), sg.InputText(key="letter",size=(15,1),do_not_clear=False)],
    [sg.Text("Enter the word:"), sg.InputText(key="word",size=(15,1),do_not_clear=False)],
    [sg.Text('',size=(40,1),key='result')],
    [sg.Button("OK",size=(8,1),button_color=('white'),bind_return_key=True), sg.Button("Home",size=(8,1),button_color=('white', 'green'))]
]

#layout for window displaying result
layout3 = [
    [sg.Push(),sg.Image(background_win),sg.Push()],
    [sg.Text('',size=(40,1),key='msgWin')],
    [sg.Button("OK",size=(8,1),button_color=('white'))]
]

layout4 = [
    [sg.Push(),sg.Image(background_lose),sg.Push()],
    [sg.Text('',size=(40,1),key='msgLose')],
    [sg.Button("OK",size=(8,1),button_color=('white'))]
]

#create windows
home_window = sg.Window("HangMan V1.0", layout1)
game_window = sg.Window("HangMan V1.0", layout2, finalize=True)
win_window = sg.Window('HangMan V1.0', layout3, finalize=True)
lose_window = sg.Window('HangMan V1.0', layout4, finalize=True)
game_window.Hide()
win_window.Hide()
lose_window.Hide()

#function for selecting random line in file
def random_line(afile):
    line = next(afile)
    for num, aline in enumerate(afile, 2):
        if random.randrange(num):
            continue
        line = aline
    return line

while True:
    event, values = home_window.read()
    if event in (None,"Exit"):
        break
    home_window.Hide()

    #declare variables
    wrongGuess = 0
    gameTitle = "H A N G M A N"
    gwList = []
    result = ""
    wsDict = {}
    game_window.find_element('result').Update(result)

    #randomly select a word from the text file
    with open('hangman/wordlist.txt', 'r') as open_file:
        answer = random_line(open_file).lower()[:-1]
        dpList = ["_" for i in range(len(answer))]
    open_file.close()

    #display winstreak info
    with open('hangman/winstreak.txt') as open_file:
        line = open_file.readline()
        while line:
            #store data in a dictionary
            line = list(line.split(':'))
            wsDict[line[0]] = int(line[1][:-1])
            line = open_file.readline()
    game_window.find_element('lws').Update(wsDict['lws'])
    game_window.find_element('cws').Update(wsDict['cws'])

    while True:
        #display info of the current game
        dpTitle = gameTitle[:2*(7-wrongGuess)]
        dpWord = ' '.join(dpList)
        dpLetter = ' '.join(gwList)
        game_window.find_element('dpTitle').Update(dpTitle)
        game_window.find_element('dpWord').Update(dpWord)
        game_window.find_element('dpLetter').Update(dpLetter)
        game_window.UnHide()

        #input screen
        event, values = game_window.read()
        if event in (None,"Home"):
            game_window.Hide()
            break

        #check if user entered correct letter
        letter = values['letter'].lower()
        word = values['word'].lower()
        if len(letter) == 1 and letter.isalpha() and letter != "":
            if letter in gwList:
                result = "This letter has already been guessed."
            elif letter in answer:
                result = "Letter "+letter+" is included in this word."
                for i in range(len(answer)):
                    if answer[i] == letter:
                        dpList[i] = letter
                gwList.append(letter)
            elif letter not in answer:
                result = "Letter "+letter+" is not included in this word."
                gwList.append(letter)
                wrongGuess += 1

        #check if user entered correct word
        elif word != "" and word.isalpha():
            if word == answer:
                msgWin = "You won. The answer is "+answer
                wsDict['cws'] += 1
                game_window.Hide()
                win_window.find_element('msgWin').Update(msgWin)
                win_window.UnHide()
                event, values = win_window.read()
                if event in (None,"OK"):
                    win_window.Hide()
                break
            elif word != answer:
                result = "Wrong guess."
                wrongGuess += 1
        else:
            result = "Please enter something valid."

        #check if game ends
        if "_" not in dpList:
            msgWin = "You won. The answer is "+answer
            wsDict['cws'] += 1
            game_window.Hide()
            win_window.find_element('msgWin').Update(msgWin)
            win_window.UnHide()
            event, values = win_window.read()
            if event in (None,"OK"):
                win_window.Hide()
            break
        elif wrongGuess == 7:
            msgLose = "You lost. The answer is "+answer
            wsDict['cws'] = 0
            game_window.Hide()
            lose_window.find_element('msgLose').Update(msgLose)
            lose_window.UnHide()
            event, values = lose_window.read()
            if event in (None,"OK"):
                lose_window.Hide()
            break

        #display the result
        game_window.find_element('result').Update(result)
    
    #check if new record is achieved
    if wsDict['cws'] > wsDict['lws']:
        wsDict['lws'] = wsDict['cws']

    #export data back to file
    with open("hangman/winstreak.txt","w") as open_file:
        for key, value in wsDict.items():
            open_file.write('%s:%s\n' % (key,value))

    home_window.UnHide()
