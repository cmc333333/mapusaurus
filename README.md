# Mapusaurus

[![CircleCI](https://circleci.com/gh/cmc333333/mapusaurus.svg?style=svg)](https://circleci.com/gh/cmc333333/mapusaurus)

![Mapusaurus screenshot](screenshot.png)


Mapusaurus is an open-source application that displays Home Mortgage
Disclosure Act data in a geo-spatial interface.


## Requirements

This currently uses:
Django 1.11
Python 3.7

You will also need:
PostgreSQL > 9.3, including 10
PostGIS

See the Pipfile (and Pipfile.lock) for more details; we recommend using
[pipenv](https://docs.pipenv.org/) for managing your dependencies.


## Setup

We'll assume you're running the Dockerized version of the app; if not, these
commands will be slightly differently, notably missing the "bin/" prefix. We
assume you've already install Docker.

Start by installing the latest Python dependencies:
```sh
bin/pipenv install --ignore-pipfile --dev
```

To create all of the relevant database tables, run:

```sh
bin/python manage.py migrate
```

### Respondent/Institution data

Start by loading a fixture with regulator agency data:
```sh
bin/python manage.py loaddata agency
```

Then, fetch and load the transmittal sheets and reporter data files:
```sh
bin/python manage.py fetch_load_transmittals
bin/python manage.py fetch_load_reporter_panels
```

### Geo

We next load state, county, CBSA, and census tract shape files by running:
```sh
bin/python manage.py fetch_load_geos
```

### FFIEC

We'll also need demographic data from the FFIEC for each tract. Fetch and load
that by running:
```sh
bin/python manage.py fetch_load_demographics --year 2013
```

### HMDA Data

Finally, we load the HMDA Loan Application Record data for each of our census
tracts:
```sh
bin/python manage.py fetch_load_hmda
```

### Start the app

To run the development version of the app, we need only run:
```sh
docker-compose up
```

Then navigate to http://localhost:8000 in a web browser.

### Building the frontend

To rebuild the frontend, run:
```sh
cd frontend
bin/npm install
bin/npm run build-dev   # or build-dist if building for production
```

We currently check the built frontend into version control, though that will
likely change in the future.
