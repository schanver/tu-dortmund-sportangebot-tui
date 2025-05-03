# tu-dortmund-sportangebot-cli
A command-line application to book for sports events in TU Dortmund. This README file is written in English. If you want to read the German version, you can read it [here](README.de.md)
# Installation
Clone the repository to the desired location using the following command:
```bash
git clone github.com/schanver/tu-dortmund-sportangebot-cli.git
````
Afterwards change into the project directory and type:
```bash
npm ci
```
# Usage
First rename the .env.example.md to .env and fill the information needed to process with the booking.

```env

NAME=Max
NACHNAME=Musterman

STRASSE_NO=Bayrische Str. 24

# Format: [PLZ] [Stadt]
PLZ_STADT=44147 Dortmund

# M -> männlich, W -> weiblich, D -> divers, X -> keine Angabe
GESCHLECHT=M

EMAIL=max.musterman@mail.com
TELEFONNUMMER=0123456789

STATUS=1
                               #  1 => Studierende TU-Dortmund
                               #  2 => Studierende FH-Dortmund
                               #  3 => Studierende RUB-/FH-Bochum
                               #  4 => Studierende einer anderen Hochschule
                               #  5 => Beschäftigte/r TU-Dortmund
                               #  6 => Beschäftigte/r FH-Dortmund
                               #  7 => Beschäftigte/r SWTDO
                               #  8 => Azubi der TU-/FH-Dortmund
                               #  9 => Gasthörer
                               # 10 => Externe/r
                               # 11 => Beschäftigte/r RUb-/FH-Bochum
                               # 12 => Beschäftigte/r einer anderen Hochschule

# Für Studierende / For Students
MATRIKELNUMMER=

# Für Beschäftigte/r und Azubi  / For staff 
DIENSTL_NO=

# Für Sportkarte exklusiv Angebote 
IBAN=

#Für Debugging / For Debugging
DEBUG=false
```

Afterwards run the program with:

``` bash
node index.js
```



# Requirements
```Nodejs```, ```a Chromium based Browser```



# License
