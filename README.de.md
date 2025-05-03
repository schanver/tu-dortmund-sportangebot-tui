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

STRASSE_NO=Bayrische Str. 24

# Format: [PLZ] [Stadt]
PLZ_STADT=44147 Dortmund
# M -> männlich, W -> weiblich, D -> divers, X -> keine Angabe
GESCHLECHT=M

EMAIL=max.musterman@mail.com
TELEFONNUMMER=0123456789

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
MATRIKELNUMMER=

# Für Beschäftigte/r und Azubi
DIENSTL_NO=

# Für Sportkarte exklusiv Angebote
IBAN=

#Für Debugging
DEBUG=false
```

Starten Sie anschließend das Programm mit:

```bash
node index.js
```

# Erforderliche Software

`Nodejs`, `ein Chromium basierter Browser`

