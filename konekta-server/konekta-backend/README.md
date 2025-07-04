````markdown
# Django Project Installation Guide

Follow these steps to set up and run the Django project on your local machine.

---

## Clone the Repository

```bash
git clone https://github.com/edge405/KONEK-TA.git
cd KONEK-TA/konekta-server/konekta-backend/konekta
```
````

## Create and Activate a Virtual Environment

### Windows

```bash
python -m venv venv
./venv/Scripts/activate
```

### Mac/Linux

```bash
python3 -m venv env
source env/bin/activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Apply Database Migrations

```bash
python manage.py migrate
```

## (Optional) Create a Superuser Account

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin user.

## Run the Development Server

```bash
python manage.py runserver
```

Open your web browser and visit:

```
http://127.0.0.1:8000/
```
