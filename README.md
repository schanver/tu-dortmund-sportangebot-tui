# Sportangebot-cli
A command-line application to book for sports events in TU Dortmund. 
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

Afterwards run the program with:


``` bash
node index.js
```

`

# Requirements 
```Nodejs```, ```a Chromium based Browser```

# Roadmap 
- [ ] Database integration to keep track of the bookings 
- [ ] More exception handling for locked or booked out courses

# License
