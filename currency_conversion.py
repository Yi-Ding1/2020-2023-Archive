from urllib.request import urlopen
from bs4 import BeautifulSoup

def curconversion():
    #scraping trading rates data from the website
    webUrl = urlopen('https://www.x-rates.com/table/?from=AUD&amount=1')
    pageHtml = webUrl.read()
    webUrl.close()
    soup = BeautifulSoup(pageHtml,'html.parser')
    results = soup.find(class_="tablesorter ratesTable",)

    #finding the desired countries from the results, listed in alphabetical order
    countryList = {'US Dollar':'','Euro':'','Japanese Yen':'','New Zealand Dollar':''}
    countryName = list(countryList.keys())

    for item in results.find_all('tr',class_=''):
        for titles in item.find_all('td',class_=''):
            title = titles.text.strip()
            if title in countryName:
                countryList[title] = float(item.find('a').text.strip())

    #asking user to enter the aud amount & print out final result
    aud = float(input('Enter amount in Australian Dollars: '))
    heading = 'Australian Dollar'

    print('Australian currency conversion\n-----------------------------------------')
    print(heading.ljust(20,' '),round(aud,2))
    for i in range(4):
        heading = countryName[i]
        trRate = countryList[heading]
        currency = aud*trRate
        print(heading.ljust(20,' '),round(currency,2))
    print('-----------------------------------------')

curconversion()