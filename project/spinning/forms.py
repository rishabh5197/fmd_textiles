from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Email, Length

from flask_wtf import FlaskForm
from wtforms import Form, FieldList, FormField, SelectField, IntegerField, SubmitField
from wtforms.validators import InputRequired, NumberRange

FABRIC_CHOICES = [
("Cotton", "Cotton"),
("Linen", "Linen"),
("Jute", "Jute"),
("Hemp", "Hemp"),
("Coir", "Coir"),
("Kapok", "Kapok"),
("Wool", "Wool"),
("Silk", "Silk"),
("Cashmere", "Cashmere"),
("Alpaca", "Alpaca"),
("Camel Hair", "Camel Hair"),
("Yak", "Yak"),
("Mohair", "Mohair"),
("Angora", "Angora"),
("Viscose", "Viscose"),
("Modal", "Modal"),
("Lyocell", "Lyocell"),
("Cupro", "Cupro"),
("Acetate", "Acetate"),
("Triacetate", "Triacetate"),
("Polyester", "Polyester"),
("Nylon", "Nylon"),
("Acrylic", "Acrylic"),
("Elastane", "Elastane"),
("Spandex", "Spandex"),
("Polypropylene", "Polypropylene"),
("Polyethylene", "Polyethylene"),
("Aramid", "Aramid"),
("Carbon Fiber", "Carbon Fiber"),
("Blends", "Blends"),
]

class FabricEntryForm(Form):
    type = SelectField("Fabric",choices=[("", "Choose fabric…")] + FABRIC_CHOICES,validators=[InputRequired(message="Select a fabric")],default="",)
    bales = IntegerField("Bales",validators=[InputRequired(message="Enter bale count"),NumberRange(min=0, message="Must be ≥ 0")],default=0,)

class BalesForm(FlaskForm):
    lines = FieldList(FormField(FabricEntryForm), min_entries=1)
    submit = SubmitField("Save entries")

