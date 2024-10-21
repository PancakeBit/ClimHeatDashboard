import threading

import firebase_admin
import schedule
import time
import requests
import asyncio
from datetime import datetime, timedelta
from flask import Flask, render_template, redirect, url_for, request, flash
from firebase_admin import credentials, firestore, db
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, login_user, login_required, logout_user, UserMixin, current_user
from flask_jwt_extended import JWTManager, create_access_token

# TODO: Bug: The "flash" function from Flask does not show any text when it is supposed to

# Create a Flask application instance
app = Flask(__name__)
# TODO: SET ACTUAL SECRET KEY AS A RANDOMLY GENERATED STRING
app.config['SECRET_KEY'] = 'your_secret_key'
login_manager = LoginManager(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Initialize Firebase credentials
cred = credentials.Certificate('static/climheat-key.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://climheat-5f408-default-rtdb.asia-southeast1.firebasedatabase.app/'
})
fsdb = firestore.client()

adminperms = False


# Set login manager of Flask
@login_manager.user_loader
def load_user(user_id):
    user_doc = fsdb.collection('users').document(user_id).get()
    global adminperms
    if user_doc.exists:
        user_data = user_doc.to_dict()
        if user_data['perms'] == 'admin':
            adminperms = True
        return User(user_id, user_data['username'], user_data['perms'])
    return None


# User Class
class User(UserMixin):
    def __init__(self, id, username, perms):
        self.id = id
        self.username = username
        self.perms = perms

# Registration Page, if called with a Post method add to firestore
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # TODO: Add error catch if user fails to register or if username/user_id is already registered
        username = request.form.get('username')
        password = request.form.get('password')
        perms = "default"

        # Hash the password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Add user to Firebase Realtime Database
        user_ref = fsdb.collection('users').document(f"{username}")
        user_ref.set({
            'username': username,
            'password': hashed_password,
            'perms' : perms
        })
        # Once registration is done, redirect to Login page
        flash('Account created successfully!', 'success')
        return redirect(url_for('login'))
    return render_template('registration.html')

# Login Page, if called with a Post method check credentials with Firestore
@app.route('/login', methods=['GET', 'POST'])
@app.route('/login.html', methods=['GET', 'POST'])
def login():
    # If user is already logged in, redirect to main page
    if current_user.is_authenticated:
        return redirect("index.html")

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        # Get user from Firebase Firestore
        user_doc = fsdb.collection('users').document(username).get()

        if user_doc.exists:
            user_data = user_doc.to_dict()
            # Check the password
            if bcrypt.check_password_hash(user_data['password'], password):
                # Log the user in using Flask-Login
                user = User(id=username, username=user_data['username'], perms=user_data['perms'])
                login_user(user)
                flash('Login successful!', 'success')
                return redirect(url_for('mainDashboard'))
            else:
                flash('Invalid password.', 'danger')
        else:
            flash('User does not exist.', 'danger')

    return render_template('login.html')

# Default URL, if user is not logged in then redirect to login page
@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect("index.html")
    else:
        return redirect("login.html")
    return render_template("index.html")

#Main Home Page, if not authenticated redirect to Login
@app.route('/index')
@app.route('/index.html')
def mainDashboard():
    if (not current_user.is_authenticated):
        return redirect("login.html")
    return render_template("index.html", adminperms=adminperms)

@app.route('/logout')
@app.route('/logout.html')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))

@app.route('/oview')
@app.route('/oview.html')
def overviewPage():
    return render_template("oview.html")

@app.route('/districts')
@app.route('/districts.html')
def districtsPage():
    return render_template("districts.html")

async def UpdateFirebaseRealtimeDB():
    today = datetime.today().strftime('%d%B%Y')
    sorted_data = getHighestTempsForBarangays()
    ref = db.reference('Barangay List/' + today)  # Adjust the Firebase path as needed
    ref.set(sorted_data)
    print(f"Updated Firebase with sorted data at {datetime.now()}")

def getHighestTempsForBarangays():
    barangay_coords = {
        "Apolonio Samson": {"lat": 14.655309849980318, "long": 121.01159460020295},
        "Baesa": {"lat": 14.674639944800129, "long": 121.0134206679377},
        "Balong Bato": {"lat": 14.608380618029102, "long": 121.02352749585779},
        "Culiat": {"lat": 14.667972601513892, "long": 121.05667298120255},
        "New Era": {"lat": 14.664747890509634, "long": 121.05958063621685},
        "Pasong Tamo": {"lat": 14.674773358844922, "long": 121.0481886197324},
        "Sangandaan": {"lat": 14.674146140551445, "long": 121.02062810933921},
        "Sauyo": {"lat": 14.689499112512255, "long": 121.03361599901578},
        "Talipapa": {"lat": 14.687678705704203, "long": 121.02534595907845},
        "Tandang Sora": {"lat": 14.681888013966427, "long": 121.03228609832858},
        "Unang Sigaw": {"lat": 14.658603132201728, "long": 120.99962414018988},
    }
    temperatures_for_each = {}
    apikey = "ab3b138474fe3eec33d92c308fd27126"

    for key in barangay_coords:
        hottest_temp = 0
        hottest_time = 0
        description = ""
        getWeatherAPI = f"https://api.openweathermap.org/data/2.5/forecast?lat={barangay_coords[key]['lat']}&lon={barangay_coords[key]['long']}&units=metric&cnt=8&appid={apikey}"
        try:
            jsonresponse = requests.get(getWeatherAPI).json()
        except requests.exceptions as e:
            print(e)
            return None
        listofdays = jsonresponse['list']

        for day, item in enumerate(listofdays):
            if listofdays[day]['main']['feels_like'] > hottest_temp:
                hottest_temp = listofdays[day]['main']['feels_like']
                description = listofdays[day]['weather'][0]['description']
                hottest_time = day
        temperatures_for_each[key] = {"hottest_temp": hottest_temp, "description": description, }

    return temperatures_for_each

def timeUntilMidnight():
    now = datetime.now()
    next_midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return (next_midnight - now).total_seconds()

dataInputtedToday = False
def check_if_data_exists_for_today():
    today = datetime.today().strftime('%d%B%Y')
    todaystemps = db.reference("/Barangay List/" + today)
    dataToday = todaystemps.get()
    return dataToday is not None  # Return True if data exists, False if not

def check_data_on_startup():
    global dataInputtedToday
    dataInputtedToday = check_if_data_exists_for_today()
    if dataInputtedToday:
        print("Today's data already exists in Firebase.")
    else:
        print("Today's data is not yet in Firebase. Update will be performed.")


async def runAtMidnight():
    global dataInputtedToday

    if dataInputtedToday:
        print("Data for today already exists. Skipping today's update.")
    else:
        # Update Firebase right away if data hasn't been inputted yet
        await UpdateFirebaseRealtimeDB()

    while True:
        # Try to get today's temperature from firebase
        # Wait until the next 12:00 AM
        seconds_until_midnight = timeUntilMidnight()
        print(seconds_until_midnight, "Until Midnight")
        await asyncio.sleep(seconds_until_midnight)
        # TODO: If database is empty at the time of running the server, then run this function once
        # Run the Firebase update at midnight
        await UpdateFirebaseRealtimeDB()



async def main():
    check_data_on_startup()

    # Start both the web server and the scheduled task concurrently
    await asyncio.gather(
        runAtMidnight(),  # Firebase update task
        asyncio.to_thread(app.run)  # Flask server running in a separate thread
    )

# If any functions need to be ran before the server starts, place them here



# Check if the file is being executed directly (i.e., not being imported)
if __name__ == '__main__':
    asyncio.run(main())