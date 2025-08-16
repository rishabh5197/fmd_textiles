from datetime import datetime
from flask_login import UserMixin
from . import db  # <-- relative import is safest here

# flask db init
# flask db migrate -m "Initial migration"
# flask db upgrade
# set FLASK_APP=app.py           # Windows CMD
# export FLASK_APP=app.py        # Linux/macOS
# $env:FLASK_APP = "app.py"      # PowerShell


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, index=True, nullable=False)
    username = db.Column(db.String(80), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.username}>"
