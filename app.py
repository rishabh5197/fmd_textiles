"""
WSGI/entry point.

Run with:
    python -m project.app
or:
    flask --app project.app run --debug
"""
from project import create_app 

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
