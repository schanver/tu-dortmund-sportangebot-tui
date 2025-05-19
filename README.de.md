# tu-dortmund-sportangebot-cli 
Eine Kommandozeilenanwendung zur Buchung von Sportveranstaltungen an der TU Dortmund.
Diese README ist auf Deutsch geschrieben. Englische Version davon kann [hier](README.md) zu finden.
# Installation

Klonen Sie das Repository mit folgendem Kommando an den gewünschten Ort:

```bash
git clone github.com/schanver/tu-dortmund-sportangebot-cli.git
```

Wechseln Sie anschließend in das Projektverzeichnis und geben Sie ein:

```bash
npm ci
```

# Verwendung

Benennen Sie zunächst die .env.example.md in .env um und füllen Sie die Informationen, die für die Verarbeitung mit der Buchung benötigt werden.

```env
NAME=Max
NACHNAME=Musterman

STRASSE_NR=Bayrische Str. 24

# Format: [PLZ] [Stadt]
PLZ_STADT=44147 Dortmund
# M -> männlich, W -> weiblich, D -> divers, X -> keine Angabe
GESCHLECHT=M

EMAIL=max.musterman@mail.com
TELEFON_NR=0123456789

STATUS=1
                               # 1 => Studierende TU-Dortmund
                               # 2 => Studierende FH-Dortmund
                               # 3 => Studierende RUB-/FH-Bochum
                               # 4 => Studierende einer anderen Hochschule
                               # 5 => Beschäftigte/r TU-Dortmund
                               # 6 => Beschäftigte/r FH-Dortmund
                               # 7 => Beschäftigte/r SWTDO
                               # 8 => Azubi der TU-/FH-Dortmund
                               # 9 => Gasthörer
                               # 10 => Externe/r
                               # 11 => Beschäftigte/r RUb-/FH-Bochum
                               # 12 => Beschäftigte/r einer anderen Hochschule

# Für Studierende
MATRIKEL_NR=

# Für Beschäftigte/r und Azubi
DIENSTL_NR=

# Für Sportkarte exklusiv Angebote
IBAN=

#Für Debugging
DEBUG=false
```

Führen Sie dann die Tests mit aus:
``` bash
npm test
```

Überprüfen Sie, ob Sie die .env korrekt ausgefüllt haben.
Starten Sie anschließend das Programm mit:

```bash
node index.js
```

# Erforderlich
[Node.js](https://nodejs.org/en/download)


