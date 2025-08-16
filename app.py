from project import app
import project.spinning.views
from flask import redirect, url_for,render_template



@app.route("/")
def home():
    return redirect(url_for("spinning.home"))

if __name__ == "__main__":
    app.run(debug=True)
