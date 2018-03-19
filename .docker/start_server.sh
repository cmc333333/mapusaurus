#!/bin/bash
set -e

if [ "${DEBUG^^}" == "TRUE" ]; then
  python manage.py runserver 0.0.0.0:"$PORT"
else
  gunicorn mapusaurus.wsgi:application -b 0.0.0.0:"$PORT" --access-logfile -
fi
