import re
from schema import *
from flask import Flask, session, redirect, url_for, request,\
    render_template, flash
from flask_socketio import SocketIO, emit
import sqlite3
from flask import g


# configuration
DATABASE = '/users.sql'
DEBUG = True
SECRET_KEY = 's\xe1^\xf4\xda\xab\xcbE`7\x10\x14D&\xcd\x9b\xa3\xd1\x0f\xa9\x82C\x0b\xdb'
USERNAME = 'admin'
PASSWORD = 'default'

app = Flask(__name__)
app.config.from_object(__name__)

socketio = SocketIO(app)


@socketio.on('connect')
def test_connect():
    emit('my response', "connected")


@socketio.on('my event')
def test_message(message):
    emit('my response', message)


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/')
def home():
    if 'username' in session:
        rows = users.select().where(users.id == session['username'])
        return render_template('home.html', stats=rows[0])
    return render_template('login.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        # check input validity
        if username == '' or password == '':
            flash('you must provide a valid input')
            return render_template('login.html')

        # check for username and password
        rows = users.select().where(users.username == username)
        if len(rows) == 0:
            flash('username not found')
            return render_template('login.html')
        pwd = rows[0].password
        if check_password_hash(pwd, password):
            session['username'] = rows[0].id
            flash('you were logged in')
            return redirect(url_for('home'))
        flash('wrong password')

    # login form if method is GET
    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        passwordconf = request.form['confirmation']

        # validate input
        if re.match('^[a-zA-Z0-9_.-]+$', username) == None or \
                re.match('^[a-zA-Z0-9_.-]+$', password) == None:
            flash('you must provide a valid input')
            return render_template('register.html')
        if password != passwordconf:
            flash('retype password correctly')
            return render_template('register.html')

        # check for existing users
        if len(users.select().where(users.username == username)) > 0:
            flash('username taken')
            return render_template('register.html')

        # create new user
        newuser = users.create(
            username=username, password=generate_password_hash(password))
        if newuser != None:
            session['username'] = newuser.id
            return redirect(url_for('home'))
        flash('failed to register')

    # register form if method is GET
    return render_template('register.html')


@app.route('/logout')
def logout():
    if 'username' in session:
        session.pop('username', None)
        flash('you were logged out')
    return redirect(url_for('home'))


@app.route('/game')
def game():
    if 'username' in session:
        return render_template('game.html')
    return redirect(url_for('home'))


@socketio.on('savegame')
def handle_savegame(stats):
    rows = users.select().where(users.id == session['username'])

    win = rows[0].wins + stats["win"]
    lose = rows[0].loses + stats["lose"]

    if stats["score"] > rows[0].highscore:
        emit('my response', "new highscore")

    score = stats["score"] if stats["score"] > rows[
        0].highscore else rows[0].highscore

    query = users.update(highscore=score, wins=win, loses=lose).where(
        users.id == session["username"])
    query.execute()


if __name__ == '__main__':
    socketio.run(app)
