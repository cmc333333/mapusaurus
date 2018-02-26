Mapusaurus [![Build Status](https://travis-ci.org/cfpb/mapusaurus.png)](https://travis-ci.org/cfpb/mapusaurus) [![Coverage Status](https://coveralls.io/repos/cfpb/mapusaurus/badge.svg)](https://coveralls.io/r/cfpb/mapusaurus)

![Mapusaurus screenshot](screenshot.png)


## Description

This repository provides data and scripts to set up an API endpoint for serving Home Mortgage Disclosure Act data as well as front-end and back-end application components that feed off this data.
Financial institution data is loaded from raw HMDA files and welded to National Information Center data to allow for more robust analysis in the front-end application.

The Mapusaurus back-end is a Python/Django application. Additional requirements are defined below.


## Requirements

This currently uses:
Django 1.11
Python 3.6

You will also need:
PostgreSQL > 9.3, including 10
PostGIS

See the Pipfile (and Pipfile.lock) for more details; we recommend using
[pipenv](https://docs.pipenv.org/) for managing your dependencies.


## Respondent/Institution data

To create the tables, you need to run:

```
    python manage.py migrate respondents
```

There's also a fixture that you need to load some information from:

```
    python manage.py loaddata agency
```

This loads static regulator agency data.

Finally, we'll fetch and load the transmittal sheets and reporter data files.

```
python manage.py fetch_load_transmittals --year 2013
python manage.py fetch_load_reporter_panels --year 2013
```


## Geo

The 'geo' application requires GeoDjango and PostGIS. Follow the instructions
for installing GeoDjango.

Here are some separate instructions for running the geo application.

```
    python manage.py migrate geo
```

Currently, we load census tract, county, CBSA, and metropolitan division files.
E.g.

```
https://www2.census.gov/geo/tiger/TIGER2013/TRACT/
https://www2.census.gov/geo/tiger/TIGER2013/COUNTY/
https://www2.census.gov/geo/tiger/TIGER2013/CBSA/
https://www2.census.gov/geo/tiger/TIGER2013/METDIV/
```

You can fetch and load this data with one command:

```
    python manage.py fetch_load_geos --year 2013
```

Once census tracts and counties are loaded, run the following command to
associate census tracts with their CBSAs.

```
    python manage.py set_tract_csa_cbsa
```

## Census Data

The 'censusdata' app loads census data to the census tracts found in the 'geo'
application. As such, 'censusdata' relies on 'geo'.

First, run migrate to create the appropriate tables

```
    python manage.py migrate censusdata
```

You'll then want to import census data related to the tracts you've loaded
while setting up the 'geo' app. These will come from
```
http://www2.census.gov/census_2010/04-Summary_File_1/
```

Loading the data looks like this:
```
    python manage.py fetch_load_summary_ones
```

## HMDA Data

The 'hmda' app loads HMDA data to the census tracts found in the 'geo'
application. As such, 'hmda' relies on 'geo'. In fact, 'hmda' will only store
data for states that are loaded via the 'geo' app.

First, run migrate to create the appropriate tables

```
    python manage.py migrate hmda
```

Next, we'll be fetching files representing all the HMDA LAR data:
```
http://www.ffiec.gov/hmda/hmdaflat.htm
```
To do this, run
```
    python manage.py fetchload_hmda --year 2013
```

You will most likely want to pre-calculate the median number of loans for a
particular lender X city pair -- this speeds up map loading quite a bit.

```
    python manage.py calculate_loan_stats 2013
```

Finally, we need to populate a listing of every (HMDA, census, geo) year.

```
    python manage.py load_years 2013 2010 2013
```

## Styles

While the base application attempts to appear "acceptable", you will likely
wish to provide your own icons, colors, etc. We provide an example app
(`basestyle`) which you can modify directly or copy into a separate Django
app. If you go the latter route, remember to activate your new app and
deactivate the basestyle.
