from peewee import *
from werkzeug.security import generate_password_hash, \
    check_password_hash


db = SqliteDatabase('users.sql')


class users(Model):
    id = PrimaryKeyField()
    username = CharField(unique=True, null=False)
    password = CharField(null=False)
    highscore = IntegerField(default=0)
    wins = IntegerField(default=0)
    loses = IntegerField(default=0)

    class Meta:
        database = db


def initialize_db():
    db.connect()
    db.create_tables([users], safe=True)


#david = users.create(username= 'david', password= generate_password_hash('123456'))

#skroob = users.create(username = 'skroob', password= generate_password_hash('12345'))
