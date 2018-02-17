#!/bin/bash

if [ ${DEBUG^^} == "TRUE" ]; then
  python mapusaurus/manage.py runserver 0.0.0.0:"$PORT"
else
  cd mapusaurus
  gunicorn mapusaurus.wsgi:application -b 0.0.0.0:"$PORT" --access-logfile -
fi
