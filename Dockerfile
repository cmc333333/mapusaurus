FROM python:2.7.13

ENV PIPENV_DEFAULT_PYTHON_VERSION="2.7.13"\
    PIPENV_SHELL_FANCY="true"\
    PIPENV_VENV_IN_PROJECT="true"

RUN apt-get update &&\
    apt-get install binutils libproj-dev gdal-bin libgeoip1 python-gdal python-pip -y &&\
    apt-get autoremove -y &&\
    rm -rf /var/lib/apt/lists/* &&\
    rm -rf /var/cache/apt/*
RUN pip install pipenv
RUN pipenv --update
VOLUME ["/app"]
WORKDIR /app
