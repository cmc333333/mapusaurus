FROM python:2.7.13

RUN apt-get update &&\
    apt-get install binutils libproj-dev gdal-bin libgeoip1 python-gdal -y &&\
    apt-get autoremove -y &&\
    rm -rf /var/lib/apt/lists/* &&\
    rm -rf /var/cache/apt/*
VOLUME ["/app"]
WORKDIR /app
